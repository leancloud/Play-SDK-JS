import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';
import { PlayErrorCode, PlayError } from './PlayError';
import { convertRoomOptions, Connection } from './Connection';

const GAME_KEEPALIVE_DURATION = 7000;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class GameConnection extends Connection {
  constructor() {
    super();
    this._flag = 'game';
  }

  _getPingDuration() {
    return GAME_KEEPALIVE_DURATION;
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
          new PlayError(PlayErrorCode.OPEN_GAME_SESSION_ERROR, err.message)
        );
      }
    });
  }

  createRoom(roomId, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        let msg = {
          cmd: 'conv',
          op: 'start',
        };
        if (roomId) {
          msg.cid = roomId;
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
          // TODO 解构房间对象

          resolve(res);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  joinRoom(roomName, matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'add',
          cid: roomName,
        };
        if (matchProperties) {
          this._cachedRoomMsg.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          this._cachedRoomMsg.expectMembers = expectedUserIds;
        }
        const res = await super.send(msg);
        if (res.reasonCode) {
          const { reasonCode, detail } = res;
          reject(new PlayError(reasonCode, detail));
        } else {
          // TODO 解构房间对象

          resolve(res);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  leaveRoom() {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'remove',
          // TODO this.room
          cid: this.room.name,
        };
        await super.send(msg);
      } catch (err) {
        reject(err);
      }
    });
  }

  setRoomOpened(opened) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'open',
          toggle: opened,
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

  setRoomVisible(visible) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'visible',
          toggle: visible,
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

  setMaster(newMasterId) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'update-master-client',
          masterActorId: newMasterId,
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

  sendEvent(eventId, eventData, options) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'direct',
          i: this._getMsgId(),
          eventId,
          msg: eventData,
          receiverGroup: options.receiverGroup,
          toActorIds: options.targetActorIds,
        };
        await super.send(msg);
      } catch (err) {
        reject(err);
      }
    });
  }

  setRoomCustomProperties(properties, expectedValues) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'update',
          attr: properties,
        };
        if (expectedValues) {
          msg.expectAttr = expectedValues;
        }
        super.send(msg);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }

  setPlayerCustomProperties(actorId, properties, expectedValues) {
    return new Promise(async (resolve, reject) => {
      try {
        const msg = {
          cmd: 'conv',
          op: 'update-player-prop',
          targetActorId: actorId,
          attr: properties,
        };
        if (expectedValues) {
          msg.expectAttr = expectedValues;
        }
        super.send(msg);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  }
}
