import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';

export default class Connection extends EventEmitter {
  constructor(userId) {
    super();
    this._requests = {};
    this._msgId = 0;
    this._userId = userId;
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
        const msg = JSON.parse(message.data);
        debug(`${this._userId} : ${this._flag} <- ${msg.op} ${message.data}`);
        const { i } = msg;
        if (!_.isNull(i) && this._requests[i]) {
          // 如果有对应 resolve，则返回
          const { resolve: res, reject: rej } = this._requests[i];
          res(msg);
        } else {
          // 否则抛出事件
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

  send(msg) {
    const msgId = this._getMsgId();
    Object.assign(msg, {
      i: msgId,
    });
    // TODO 输出日志
    const msgData = JSON.stringify(msg);
    debug(`${this._userId} : ${this._flag} -> ${msg.op} ${msgData}`);
    return new Promise((resolve, reject) => {
      this._requests[msgId] = {
        msg,
        resolve,
        reject,
      };
      this._ws.send(msgData);
    });
  }

  close() {
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
}
