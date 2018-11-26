import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';
import { PlayErrorCode, PlayError } from './PlayError';
import { convertRoomOptions, Connection } from './Connection';

const LOBBY_KEEPALIVE_DURATION = 120000;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class LobbyConnection extends Connection {
  constructor() {
    super();
    this._flag = 'lobby';
  }

  _getPingDuration() {
    return LOBBY_KEEPALIVE_DURATION;
  }

  openSession(appId, userId, gameVersion) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'session',
          op: 'open',
          appId,
          peerId: userId,
          sdkVersion: PlayVersion,
          gameVersion,
        };
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
          // TODO 抛出连接失败的事件
        } else {
          resolve();
        }
      } catch (err) {
        reject(
          new PlayError(PlayErrorCode.OPEN_LOBBY_SESSION_ERROR, err.message)
        );
      }
    });
  }

  joinLobby() {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'lobby',
          op: 'add',
        };
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          resolve();
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  leaveLobby() {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'lobby',
          op: 'remove',
        };
        await super.send(msg);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  createRoom(roomName, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        let msg = {
          cmd: 'conv',
          op: 'start',
        };
        if (roomName) {
          msg.cid = roomName;
        }
        // 拷贝房间属性（包括 系统属性和玩家定义属性）
        if (roomOptions) {
          msg = Object.assign(msg, convertRoomOptions(roomOptions));
        }
        if (expectedUserIds) {
          msg.expectMembers = expectedUserIds;
        }
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          const { cid, addr, secureAddr } = res;
          resolve({ cid, addr, secureAddr });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  joinRoom(roomName, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'add',
          cid: roomName,
        };
        if (expectedUserIds) {
          msg.expectMembers = expectedUserIds;
        }
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          const { cid, addr, secureAddr } = res;
          resolve({ cid, addr, secureAddr });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'add',
          i: this._getMsgId(),
          cid: roomName,
          createOnNotFound: true,
        };
        if (expectedUserIds) {
          msg.expectMembers = expectedUserIds;
        }
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          const { op, cid, addr, secureAddr } = res;
          resolve({ op, cid, addr, secureAddr });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  joinRandomRoom(matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'add-random',
        };
        if (matchProperties) {
          msg.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          msg.expectMembers = expectedUserIds;
        }
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          const { op, cid, addr, secureAddr } = res;
          resolve({ op, cid, addr, secureAddr });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  rejoinRoom(roomName) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'add',
          i: this._getMsgId(),
          cid: roomName,
          rejoin: true,
        };
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          const { cid, addr, secureAddr } = res;
          resolve({ cid, addr, secureAddr });
        }
      } catch (err) {
        reject(err);
      }
    });
  }
}
