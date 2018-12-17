import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { clearTimeout, setTimeout } from 'timers';
import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';

const MAX_NO_PONG_TIMES = 2;
const MAX_PLAYER_COUNT = 10;

export const ERROR_EVENT = 'ERROR_EVENT';
export const DISCONNECT_EVENT = 'DISCONNECT_EVENT';

export function convertRoomOptions(roomOptions) {
  const options = {};
  if (!roomOptions.opened) options.open = roomOptions.opened;
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

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration", "_handleMessage", "_handleErrorMsg", "_handleUnknownMsg"] }] */
export default class Connection extends EventEmitter {
  constructor() {
    super();
    this._requests = {};
    this._msgId = 0;
    this._pingTimer = null;
    this._pongTimer = null;
  }

  connect(server, userId) {
    this._userId = userId;
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      this._ws = new WebSocket(server);
      this._ws.onopen = () => {
        debug(`${this._userId} : ${this._flag} connection opened`);
        this._connected();
        resolve();
      };
      this._ws.onclose = () => {
        reject(
          new PlayError(PlayErrorCode.OPEN_WEBSOCKET_ERROR, 'websocket closed')
        );
      };
      this._ws.onerror = err => {
        reject(new PlayError(PlayErrorCode.OPEN_WEBSOCKET_ERROR, err.message));
      };
    });
  }

  _connected() {
    this._ws.onmessage = message => {
      this._stopPong();
      this._pongTimer = setTimeout(() => {
        this._pingTimer = setTimeout(() => {
          this._ws.close();
        }, this._getPingDuration());
      }, this._getPingDuration() * MAX_NO_PONG_TIMES);
      const msg = JSON.parse(message.data);
      debug(`${this._userId} : ${this._flag} <- ${msg.op} ${message.data}`);
      const { i } = msg;
      if (!_.isNull(i) && this._requests[i]) {
        // 如果有对应 resolve，则返回
        const { resolve, reject } = this._requests[i];
        if (msg.cmd === 'error') {
          const { reasonCode, detail } = msg;
          reject(new PlayError(reasonCode, detail));
        } else {
          resolve(msg);
        }
      } else if (_.isEmpty(msg)) {
        debug('pong');
      } else {
        // 通知类消息交由子类处理事件
        this._handleMessage(msg);
      }
    };
    this._ws.onclose = () => {
      this._stopPing();
      this._stopPong();
      this.emit(DISCONNECT_EVENT);
    };
  }

  send(msg, withIndex = true) {
    const msgId = this._getMsgId();
    if (withIndex) {
      Object.assign(msg, {
        i: msgId,
      });
    }
    // 输出日志
    const msgData = JSON.stringify(msg);
    debug(`${this._userId} : ${this._flag} -> ${msg.op} ${msgData}`);
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      if (this._ws.readyState === WebSocket.OPEN) {
        this._requests[msgId] = {
          msg,
          resolve,
          reject,
        };
        this._ws.send(msgData);
        // 处理心跳包
        this._stopPing();
        this._pingTimer = setTimeout(() => {
          const ping = {};
          this.send(ping, false);
        }, this._getPingDuration());
      } else {
        reject(
          new PlayError(
            PlayErrorCode.SEND_MESSAGE_STATE_ERROR,
            `Websocket send message error state: ${this._ws.readyState}`
          )
        );
      }
    });
  }

  close() {
    this._stopPing();
    this._stopPong();
    return new Promise((resolve, reject) => {
      if (this._ws) {
        this._ws.onopen = null;
        this._ws.onmessage = null;
        this._ws.onclose = () => {
          debug(`${this._userId} : ${this._flag} closed`);
          resolve();
        };
        this._ws.onerror = err => {
          reject(
            new PlayError(PlayErrorCode.CLOSE_WEBSOCKET_ERROR, err.message)
          );
        };
        this._ws.close();
      } else {
        resolve();
      }
    });
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

  /* eslint no-unused-vars: ["error", { "args": "none" }] */
  _handleMessage(msg) {
    throw new Error('must implement the method');
  }

  _handleErrorMsg(msg) {
    error(JSON.stringify(msg));
    const { reasonCode: code, detail } = msg;
    this.emit(ERROR_EVENT, { code, detail });
  }

  _handleUnknownMsg(msg) {
    error(`unknow msg: ${JSON.stringify(msg)}`);
  }
}
