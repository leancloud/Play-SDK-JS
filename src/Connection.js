import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import { sdkVersion, protocolVersion } from './Config';
import { serializeObject } from './CodecUtils';

// eslint-disable-next-line camelcase
const google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');

// eslint-disable-next-line camelcase
const { BoolValue } = google_protobuf_wrappers_pb;

const protocol = require('./proto/messages_pb');

const {
  Command,
  Body,
  RoomOptions,
  SessionOpenRequest,
  RequestMessage,
  CommandType,
  OpType,
} = protocol;

const MAX_NO_PONG_TIMES = 2;
const MAX_PLAYER_COUNT = 10;

export const ERROR_EVENT = 'ERROR_EVENT';
export const DISCONNECT_EVENT = 'DISCONNECT_EVENT';

export function convertToRoomOptions(roomName, options, expectedUserIds) {
  const roomOptions = new RoomOptions();
  if (roomName) {
    roomOptions.setCid(roomName);
  }
  if (options) {
    const {
      open,
      visible,
      emptyRoomTtl,
      playerTtl,
      maxPlayerCount,
      customRoomProperties,
      customRoomPropertyKeysForLobby,
      flag,
      pluginName,
    } = options;
    if (open !== undefined) {
      const o = new BoolValue();
      o.setValue(open);
      roomOptions.setOpen(open);
    }
    if (visible !== undefined) {
      const v = new BoolValue();
      v.setValue(visible);
      roomOptions.setVisible(v);
    }
    if (emptyRoomTtl > 0) {
      roomOptions.setEmptyRoomTtl(emptyRoomTtl);
    }
    if (playerTtl > 0) {
      roomOptions.setPlayerTtl(playerTtl);
    }
    if (maxPlayerCount > 0 && maxPlayerCount < MAX_PLAYER_COUNT) {
      roomOptions.setMaxMembers(maxPlayerCount);
    }
    if (customRoomProperties) {
      roomOptions.setAttr(serializeObject(customRoomProperties));
    }
    if (customRoomPropertyKeysForLobby) {
      roomOptions.setLobbyAttrKeysList(customRoomPropertyKeysForLobby);
    }
    if (flag !== undefined) {
      roomOptions.setFlag(flag);
    }
    if (pluginName) {
      roomOptions.setPluginName(pluginName);
    }
  }
  if (expectedUserIds) {
    roomOptions.setExpectMembersList(expectedUserIds);
  }
  return roomOptions;
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
      this._ws = new WebSocket(server, 'protobuf.1');
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
      this._pong();
      const command = Command.deserializeBinary(message.data);
      const cmd = command.getCmd();
      const op = command.getOp();
      const body = Body.deserializeBinary(command.getBody());
      debug(
        `${this._userId} : ${this._flag} <- ${cmd}/${op}: ${JSON.stringify(
          body.toObject()
        )}`
      );
      if (this._isMessageQueueRunning) {
        this._handleCommand(cmd, op, body);
      } else {
        debug(
          `[DELAY] ${this._userId} : ${
            this._flag
          } <- ${cmd}/${op}: ${JSON.stringify(body.toObject())}`
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
      this.emit(DISCONNECT_EVENT);
    };
  }

  async openSession(appId, userId, gameVersion) {
    const sessionOpen = new SessionOpenRequest();
    sessionOpen.setAppId(appId);
    sessionOpen.setPeerId(userId);
    sessionOpen.setSdkVersion(sdkVersion);
    sessionOpen.setGameVersion(gameVersion);
    sessionOpen.setProtocolVersion(protocolVersion);
    const req = new RequestMessage();
    req.setSessionOpen(sessionOpen);
    await this.sendRequest(CommandType.SESSION, OpType.OPEN, req);
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

  async sendRequest(cmd, op, req) {
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

  async sendCommand(cmd, op, body) {
    const command = new Command();
    command.setCmd(cmd);
    command.setOp(op);
    command.setBody(body.serializeBinary());
    debug(
      `${this._userId} : ${this._flag} -> ${cmd}/${op}: ${JSON.stringify(
        body.toObject()
      )}`
    );
    this._ws.send(command.serializeBinary());
    // ping
    this._ping();
  }

  close() {
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

  _simulateDisconnection() {
    this._ws.close();
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
