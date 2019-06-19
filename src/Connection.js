import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import { tap } from './Utils';

const MAX_NO_PONG_TIMES = 2;
const MAX_PLAYER_COUNT = 10;

export const ERROR_EVENT = 'ERROR_EVENT';
export const DISCONNECT_EVENT = 'DISCONNECT_EVENT';

export function convertRoomOptions(roomOptions) {
  const options = {};
  if (!roomOptions.open) options.open = roomOptions.open;
  if (!roomOptions.visible) options.visible = roomOptions.visible;
  if (roomOptions.emptyRoomTtl > 0)
    options.emptyRoomTtl = roomOptions.emptyRoomTtl;
  if (roomOptions.playerTtl > 0) options.playerTtl = roomOptions.playerTtl;
  if (
    roomOptions.maxPlayerCount > 0 &&
    roomOptions.maxPlayerCount < MAX_PLAYER_COUNT
  )
    options.maxMembers = roomOptions.maxPlayerCount;
  if (roomOptions.customRoomProperties)
    options.attr = roomOptions.customRoomProperties;
  if (roomOptions.customRoomPropertyKeysForLobby)
    options.lobbyAttrKeys = roomOptions.customRoomPropertyKeysForLobby;
  if (roomOptions.flag) options.flag = roomOptions.flag;
  return options;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration", "_handleNotification", "_handleErrorMsg", "_handleUnknownMsg"] }] */
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
  }

  connect(server, userId) {
    this._userId = userId;
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      this._ws = new WebSocket(server);
      this._ws.onopen = () => {
        debug(`${this._userId} : ${this._flag} connection open`);
        this._connected();
        resolve();
      };
      this._ws.onclose = () => {
        reject(
          new PlayError(PlayErrorCode.OPEN_WEBSOCKET_ERROR, 'websocket closed')
        );
      };
      this._ws.onerror = err => {
        reject(err);
      };
    });
  }

  _connected() {
    // 每次连接成功后将会得到最新快照，之前的缓存没有意义了
    this._isMessageQueueRunning = true;
    this._messageQueue = [];
    this._ws.onmessage = message => {
      this._stopPong();
      this._pongTimer = setTimeout(() => {
        this._pingTimer = setTimeout(() => {
          this._ws.close();
        }, this._getPingDuration());
      }, this._getPingDuration() * MAX_NO_PONG_TIMES);
      const msg = JSON.parse(message.data);
      debug(`${this._userId} : ${this._flag} <- ${msg.op} ${message.data}`);
      if (this._isMessageQueueRunning) {
        this._handleMessage(msg);
      } else {
        this._messageQueue.push(msg);
      }
    };
    this._ws.onclose = () => {
      this._stopPing();
      this._stopPong();
      this.emit(DISCONNECT_EVENT);
    };
  }

  async send(msg, withIndex = true, ignoreServerError = true) {
    const msgId = this._getMsgId();
    if (withIndex) {
      Object.assign(msg, {
        i: msgId,
      });
    }
    // 输出日志
    const msgData = JSON.stringify(msg);
    debug(`${this._userId} : ${this._flag} -> ${msg.op} ${msgData}`);
    const { WebSocket } = adapters;
    if (this._ws.readyState !== WebSocket.OPEN) {
      throw new PlayError(
        PlayErrorCode.SEND_MESSAGE_STATE_ERROR,
        `Websocket send message error state: ${this._ws.readyState}`
      );
    }
    this._ws.send(msgData);
    // 处理心跳包
    this._stopPing();
    this._pingTimer = setTimeout(() => {
      const ping = {};
      this.send(ping, false);
    }, this._getPingDuration());

    if (!withIndex) {
      return undefined;
    }
    return new Promise((resolve, reject) => {
      this._requests[msgId] = {
        msg,
        resolve,
        reject,
      };
    }).then(
      ignoreServerError
        ? undefined
        : tap(res => {
            if (res.reasonCode) {
              const { reasonCode, detail } = res;
              throw new PlayError(reasonCode, detail);
            }
          })
    );
  }

  close() {
    this._stopPing();
    this._stopPong();
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

  _simulateDisconnection() {
    this._ws.close();
  }

  _getMsgId() {
    this._msgId += 1;
    return this._msgId;
  }

  _stopPing() {
    if (this._pingTimer) {
      clearTimeout(this._pingTimer);
      this._pingTimer = null;
    }
  }

  _stopPong() {
    if (this._pongTimer) {
      clearTimeout(this._pongTimer);
      this._pongTimer = null;
    }
  }

  _getPingDuration() {
    throw new Error('must implement the method');
  }

  _handleMessage(msg) {
    const { i } = msg;
    if (!_.isNull(i) && this._requests[i]) {
      // 如果有对应 resolve，则返回
      const { resolve, reject } = this._requests[i];
      if (msg.cmd === 'error') {
        this._handleErrorMsg(msg);
        const { reasonCode, detail } = msg;
        reject(new PlayError(reasonCode, detail));
      } else {
        resolve(msg);
      }
    } else if (_.isEmpty(msg)) {
      debug('pong');
    } else {
      // 通知类消息交由子类处理事件
      this._handleNotification(msg);
    }
  }

  /* eslint no-unused-vars: ["error", { "args": "none" }] */
  _handleNotification(msg) {
    throw new Error('must implement the method');
  }

  _handleErrorMsg(msg) {
    error(JSON.stringify(msg));
  }

  _handleErrorNotify(msg) {
    this._handleErrorMsg(msg);
    const { reasonCode: code, detail } = msg;
    this.emit(ERROR_EVENT, { code, detail });
  }

  _handleUnknownMsg(msg) {
    error(`unknown msg: ${JSON.stringify(msg)}`);
  }

  _pauseMessageQueue() {
    this._isMessageQueueRunning = false;
  }

  _resumeMessageQueue() {
    this._isMessageQueueRunning = true;
    while (this._messageQueue.length > 0) {
      const msg = this._messageQueue.shift();
      this._handleMessage(msg);
    }
  }
}
