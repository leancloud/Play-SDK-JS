import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { clearTimeout, setTimeout } from 'timers';
import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';

const MAX_NO_PONG_TIMES = 2;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class Connection extends EventEmitter {
  constructor(userId) {
    super();
    this._requests = {};
    this._msgId = 0;
    this._userId = userId;
    this._pingTimer = null;
    this._pongTimer = null;
  }

  connect(server) {
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      this._ws = new WebSocket(server);
      this._ws.onopen = () => {
        debug('lobby connection opened');
        resolve();
      };
      this._ws.onmessage = message => {
        this._stopPong();
        this._pongTimer = setTimeout(() => {
          this._pingTimer = setTimeout(() => {
            this._ws.onclose = () => {
              // TODO 发送「断线」事件
            };
            this._ws.close();
          }, this._getPingDuration());
        }, this._getPingDuration() * MAX_NO_PONG_TIMES);
        const msg = JSON.parse(message.data);
        debug(`${this._userId} : ${this._flag} <- ${msg.op} ${message.data}`);
        const { i } = msg;
        if (!_.isNull(i) && this._requests[i]) {
          // 如果有对应 resolve，则返回
          const { resolve: res, reject: rej } = this._requests[i];
          res(msg);
        } else {
          // TODO 否则抛出事件
          debug('emit');
        }
      };
      this._ws.onclose = () => {};
      this._ws.onerror = err => {
        error(err);
        reject();
      };
    });
  }

  send(msg, needIndex = true) {
    const msgId = this._getMsgId();
    if (needIndex) {
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
        // TODO Websocket 状态错误
        reject();
      }
    });
  }

  close() {
    this._stopPing();
    this._stopPong();
    return new Promise((resolve, reject) => {
      this._ws.onopen = null;
      this._ws.onmessage = null;
      this._ws.onclose = () => {
        debug(`${this._flag} closed`);
        resolve();
      };
      this._ws.onerror = err => {
        reject(err);
      };
      this._ws.close();
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
}
