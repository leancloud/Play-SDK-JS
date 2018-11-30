import { PlayVersion } from './Config';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import Connection, { convertRoomOptions } from './Connection';
import LobbyRoom from './LobbyRoom';

const LOBBY_KEEPALIVE_DURATION = 120000;

// 大厅连接抛出的事件
export const ROOM_LIST_UPDATED_EVENT = 'ROOM_LIST_UPDATED_EVENT';

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class LobbyConnection extends Connection {
  constructor() {
    super();
    this._flag = 'lobby';
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
          reject(
            new PlayError(
              PlayErrorCode.OPEN_LOBBY_SESSION_ERROR,
              `${reasonCode} : ${detail}`
            )
          );
        } else {
          resolve();
        }
      } catch (err) {
        reject(
          new PlayError(PlayErrorCode.OPEN_LOBBY_SESSION_ERROR, err.detail)
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
          reject(
            new PlayError(
              PlayErrorCode.JOIN_LOBBY_ERROR,
              `${reasonCode} : ${detail}`
            )
          );
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
          reject(
            new PlayError(
              PlayErrorCode.LOBBY_CREATE_ROOM_ERROR,
              `${reasonCode} : ${detail}`
            )
          );
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
          reject(
            new PlayError(
              PlayErrorCode.LOBBY_JOIN_ROOM_ERROR,
              `${reasonCode} : ${detail}`
            )
          );
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
          const { op, reasonCode, detail } = res;
          if (op === 'started') {
            reject(
              new PlayError(
                PlayErrorCode.LOBBY_CREATE_ROOM_ERROR,
                `${reasonCode} : ${detail}`
              )
            );
          } else if (op === 'added') {
            reject(
              new PlayError(
                PlayErrorCode.LOBBY_JOIN_ROOM_ERROR,
                `${reasonCode} : ${detail}`
              )
            );
          } else {
            reject(
              new PlayError(
                PlayErrorCode.UNKNOWN_ERROR,
                `${reasonCode} : ${detail}`
              )
            );
          }
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
          reject(
            new PlayError(
              PlayErrorCode.LOBBY_JOIN_RANDOM_ROOM_ERROR,
              `${reasonCode} : ${detail}`
            )
          );
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

  _getPingDuration() {
    return LOBBY_KEEPALIVE_DURATION;
  }

  // 处理被动通知消息
  _handleMessage(msg) {
    switch (msg.cmd) {
      case 'lobby':
        switch (msg.op) {
          case 'room-list':
            this._handleRoomListMsg(msg);
            break;
          default:
            super._handleUnknownMsg(msg);
            break;
        }
        break;
      case 'events':
        // 目前不作处理
        break;
      case 'statistic':
        // 目前不作处理
        break;
      case 'conv':
        switch (msg.op) {
          case 'results':
            this._handleRoomListMsg(msg);
            break;
          default:
            super._handleUnknownMsg(msg);
            break;
        }
        break;
      case 'error':
        super._handleErrorMsg(msg);
        break;
      default:
        super._handleUnknownMsg(msg);
        break;
    }
  }

  _handleRoomListMsg(msg) {
    const roomList = [];
    for (let i = 0; i < msg.list.length; i += 1) {
      const lobbyRoomDTO = msg.list[i];
      roomList.push(new LobbyRoom(lobbyRoomDTO));
    }
    this.emit(ROOM_LIST_UPDATED_EVENT, roomList);
  }
}
