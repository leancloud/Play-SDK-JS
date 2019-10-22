import EventEmitter from 'eventemitter3';
import StateMachine from 'javascript-state-machine';

import { debug, error } from './Logger';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import { adapters } from './PlayAdapter';

const protocol = require('./proto/messages_pb');

const { Command, Body, CommandType, OpType } = protocol;

const CommandTypeSwap = Object.keys(CommandType).reduce(
  (obj, key) => Object.assign({}, obj, { [CommandType[key]]: key }),
  {}
);
const OpTypeSwap = Object.keys(OpType).reduce(
  (obj, key) => Object.assign({}, obj, { [OpType[key]]: key }),
  {}
);

const MAX_NO_PONG_TIMES = 2;

export const ERROR_EVENT = 'ERROR_EVENT';
export const DISCONNECT_EVENT = 'DISCONNECT_EVENT';

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration", "_handleNotification", "_handleErrorMsg", "_handleUnknownMsg", "_getFastOpenUrl"] }] */
export default class Connection extends EventEmitter {
  constructor() {
    super();
    this._requests = {};
    this._msgId = 0;
    this._pingTimer = null;
    this._pongTimer = null;
    // 消息处理及缓存
    this._isMessageQueueRunning = false;
    this._messageQueue = null;
    this._fsm = new StateMachine({
      init: 'init',
      final: 'closed',
      transitions: [
        { name: 'connect', from: 'init', to: 'connecting' },
        { name: 'connected', from: 'connecting', to: 'connected' },
        { name: 'connectFailed', from: 'connecting', to: 'init' },
        { name: 'disconnect', from: 'connected', to: 'disconnected' },
        {
          name: 'close',
          from: ['init', 'connecting', 'connected', 'disconnected'],
          to: 'closed',
        },
      ],
    });
  }

  connect(appId, server, gameVersion, userId, sessionToken) {
    this._userId = userId;
    this._fsm.connect();
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      const url = this._getFastOpenUrl(
        server,
        appId,
        gameVersion,
        userId,
        sessionToken
      );
      debug(`url: ${url}`);
      this._ws = new WebSocket(url, 'protobuf.1');
      this._ws.onopen = () => {
        debug(`${this._userId} : ${this._flag} connection open`);
        if (this._fsm.is('closed')) {
          this._ws.onopen = null;
          this._ws.onmessage = null;
          this._ws.onclose = null;
          this._ws.onerror = null;
          this._ws.close();
          return;
        }
        this._connected();
      };
      this._ws.onclose = () => {
        this._fsm.connectFailed();
        reject(
          new PlayError(PlayErrorCode.OPEN_WEBSOCKET_ERROR, 'websocket closed')
        );
      };
      this._ws.onerror = err => {
        this._fsm.connectFailed();
        reject(err);
      };
      // 标记
      this._requests[0] = {
        resolve,
        reject,
      };
    });
  }

  _connected() {
    // 每次连接成功后将会得到最新快照，之前的缓存没有意义了
    this._isMessageQueueRunning = true;
    this._messageQueue = [];
    this._ws.onmessage = message => {
      this._pong();
      const command = Command.deserializeBinary(message.data);
      const cmd = command.getCmd();
      const op = command.getOp();
      const body = Body.deserializeBinary(command.getBody());
      debug(
        `${this._userId} : ${this._flag} <- ${CommandTypeSwap[cmd]}/${
          OpTypeSwap[op]
        }: ${JSON.stringify(body.toObject())}`
      );
      if (this._isMessageQueueRunning) {
        this._handleCommand(cmd, op, body);
      } else {
        debug(
          `[DELAY] ${this._userId} : ${this._flag} <- ${CommandTypeSwap[cmd]}/${
            OpTypeSwap[op]
          }: ${JSON.stringify(body.toObject())}`
        );
        this._messageQueue.push({
          cmd,
          op,
          body,
        });
      }
    };
    this._ws.onclose = () => {
      this._stopKeppAlive();
      this._fsm.disconnect();
      this.emit(DISCONNECT_EVENT);
    };
    this._fsm.connected();
  }

  _handleCommand(cmd, op, body) {
    if (body.hasResponse()) {
      // 应答
      const res = body.getResponse();
      const i = res.getI();
      if (this._requests[i]) {
        const { resolve, reject } = this._requests[i];
        const errorInfo = res.getErrorInfo();
        if (errorInfo) {
          const code = errorInfo.getReasonCode();
          const detail = errorInfo.getDetail();
          reject(new PlayError(code, detail));
        } else {
          resolve({
            cmd,
            op,
            res,
          });
        }
      } else {
        // 异常情况
        error(`error response: ${JSON.stringify(res.toObject())}`);
      }
    } else {
      // 通知
      this._handleNotification(cmd, op, body);
    }
  }

  sendRequest(cmd, op, req) {
    const msgId = this._getMsgId();
    req.setI(msgId);
    const body = new Body();
    body.setRequest(req);
    this.sendCommand(cmd, op, body);
    return new Promise((resolve, reject) => {
      this._requests[msgId] = {
        resolve,
        reject,
      };
    });
  }

  sendCommand(cmd, op, body) {
    const command = new Command();
    command.setCmd(cmd);
    command.setOp(op);
    command.setBody(body.serializeBinary());
    debug(
      `${this._userId} : ${this._flag} -> ${CommandTypeSwap[cmd]}/${
        OpTypeSwap[op]
      }: ${JSON.stringify(body.toObject())}`
    );
    this._ws.send(command.serializeBinary());
    // ping
    this._ping();
  }

  close() {
    if (this._fsm.cannot('close')) {
      throw new Error(`no close: ${this._fsm.state}`);
    }
    this._stopKeppAlive();
    return new Promise((resolve, reject) => {
      if (this._ws) {
        this._ws.onopen = null;
        this._ws.onmessage = null;
        debug(`${this._userId} : ${this._flag} close`);
        this._ws.onclose = () => {
          debug(`${this._userId} : ${this._flag} closed`);
          resolve();
        };
        this._ws.onerror = err => {
          reject(err);
        };
        this._ws.close();
      } else {
        resolve();
      }
    });
  }

  _getFastOpenUrl(server, appId, gameVersion, userId, sessionToken) {
    throw new Error('must implement the method');
  }

  _simulateDisconnection() {
    this.close();
    this.emit(DISCONNECT_EVENT);
    return Promise.resolve();
  }

  _getMsgId() {
    this._msgId += 1;
    return this._msgId;
  }

  _ping() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
      this._pingTimer = null;
    }
    this._pingTimer = setTimeout(() => {
      this._ws.send('{}');
    }, this._getPingDuration());
  }

  _pong() {
    if (this._pongTimer) {
      clearTimeout(this._pongTimer);
      this._pongTimer = null;
    }
    this._pongTimer = setTimeout(() => {
      this._pingTimer = setTimeout(() => {
        this._ws.close();
      }, this._getPingDuration());
    }, this._getPingDuration() * MAX_NO_PONG_TIMES);
  }

  _stopKeppAlive() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
      this._pingTimer = null;
    }
    if (this._pongTimer) {
      clearTimeout(this._pongTimer);
      this._pongTimer = null;
    }
  }

  _getPingDuration() {
    throw new Error('must implement the method');
  }

  /* eslint no-unused-vars: ["error", { "args": "none" }] */
  _handleNotification(cmd, op, body) {
    throw new Error('must implement the method');
  }

  _handleErrorNotify(body) {
    const errorInfo = body.getErrorInfo();
    const code = errorInfo.getRaseonCode();
    const detail = errorInfo.getDetail();
    this.emit(ERROR_EVENT, { code, detail });
  }

  _handleUnknownMsg(cmd, op, body) {
    error(
      `[UNKNOWN COMMAND] ${this._userId} : ${
        this._flag
      } -> ${cmd}/${op}: ${JSON.stringify(body.toObject())}`
    );
  }

  _pauseMessageQueue() {
    this._isMessageQueueRunning = false;
  }

  _resumeMessageQueue() {
    this._isMessageQueueRunning = true;
    while (this._messageQueue.length > 0) {
      const msg = this._messageQueue.shift();
      const { cmd, op, body } = msg;
      debug(
        `[DELAY HANDLE] ${this._userId} : ${
          this._flag
        } <- ${cmd}/${op}: ${JSON.stringify(body.toObject())}`
      );
      this._handleCommand(cmd, op, body);
    }
  }
}
