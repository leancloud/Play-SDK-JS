import EventEmitter from 'eventemitter3';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';

export default class LobbyConnection extends EventEmitter {
  constructor() {
    super();
    this._requests = {};
    this._msgId = 0;
  }

  connect({ server, appId, userId, gameVersion }) {
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      this._ws = new WebSocket(server);
      this._ws.onopen = () => {
        // TODO 发送 session
        const msg = {
          cmd: 'session',
          op: 'open',
          i: this._getMsgId(),
          appId,
          peerId: userId,
          sdkVersion: PlayVersion,
          gameVersion,
        };
        this.send(msg);
      };
      this._ws.onmessage = msg => {
        // 如果有对应 resolve，则返回
        // 否则抛出事件
      };
      this._ws.onclose = () => {};
      this._ws.onerror = err => {
        error(err);
      };
    });
  }

  send(msg) {
    // TODO 输出日志
    // const msgData = JSON.stringify(msg);
    // debug(`${this.userId} lobby msg: ${msg.op} \n-> ${msgData}`);
    this._ws.send(msg);
  }

  _getMsgId() {
    this._msgId += 1;
    return this._msgId;
  }
}
