import machina from 'machina';

import { debug, warn, error } from './Logger';
import AppRouter from './AppRouter';
import LobbyConnection from './LobbyConnection';
import GameConnection from './GameConnection';
import { PlayVersion } from './Config';

const MAX_PLAYER_COUNT = 10;

function convertRoomOptions(roomOptions) {
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

const PlayFSM = machina.Fsm.extend({
  initialize(opts) {
    this._play = opts.play;
  },

  namespace: 'play',

  initialState: 'init',

  states: {
    init: {
      _onEnter() {
        debug('init _onEnter()');
        const { _appId, _insecure, _feature } = this._play;
        this._router = new AppRouter({
          appId: _appId,
          insecure: _insecure,
          feature: _feature,
        });
      },
      connect() {
        debug(`init connect(${this._play._gameVersion})`);
        this.transition('connecting');
        return new Promise(async (resolve, reject) => {
          try {
            const serverInfo = await this._router.connect(
              this._play._gameVersion
            );
            const { primaryServer, secondaryServer } = serverInfo;
            debug(
              `AppRouter connect resolve ${primaryServer}, ${secondaryServer}`
            );
            this._primaryServer = primaryServer;
            this._secondaryServer = secondaryServer;
            // 与大厅建立连接
            this._lobbyConn = new LobbyConnection(this._play.userId);
            await this._lobbyConn.connect(this._primaryServer);
            // 打开会话
            const sessionMsg = this._newOpenLobbySessionMsg();
            const sessionResMsg = await this._lobbyConn.send(sessionMsg);
            if (sessionResMsg.reasonCode) {
              // TODO 关闭 socket 连接

              // TODO 抛出连接失败的事件

              const { reasonCode, detail } = sessionResMsg;
              reject(new Error(`${reasonCode}, ${detail}`));
            } else {
              this.transition('lobbyConnected');
              resolve();
            }
          } catch (err) {
            // TODO 判断 error 类型
            reject(err);
          }
        });
      },
    },

    connecting: {
      _onEnter() {
        debug('connecting _onEnter()');
      },
    },

    lobbyConnected: {
      _onEnter() {
        debug('lobbyConnected _onEnter()');
      },

      joinLobby() {
        return new Promise(async (resolve, reject) => {
          try {
            const resMsg = await this._joinLobby();
            if (resMsg.reasonCode) {
              const { reasonCode, detail } = resMsg;
              reject(new Error(`${reasonCode}, ${detail}`));
            } else {
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        });
      },

      leaveLobby() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._leaveLobby();
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      createRoom({
        roomName = null,
        roomOptions = null,
        expectedUserIds = null,
      } = {}) {
        this.transition('lobbyToGame');
        return new Promise(async (resolve, reject) => {
          try {
            const createRoomMsg = this._newCreateRoomMsg({
              roomName,
              roomOptions,
              expectedUserIds,
            });
            const lobbyResMsg = await this._lobbyConn.send(createRoomMsg);
            if (lobbyResMsg.reasonCode) {
              this._reject(lobbyResMsg, reject);
            } else {
              if (lobbyResMsg.cid) {
                createRoomMsg.cid = lobbyResMsg.cid;
              }
              debug(lobbyResMsg.cid);
              // 连接游戏服务器
              const gameServer = lobbyResMsg.addr || lobbyResMsg.secureAddr;
              await this._connectGameServer(gameServer);
              // 在游戏服务器上创建房间
              const gameCreateRoomResMsg = await this._gameConn.send(
                createRoomMsg
              );
              if (gameCreateRoomResMsg.reasonCode) {
                // 创建房间失败
                await this._gameConn.close();
                this._reject(gameCreateRoomResMsg, reject);
              } else {
                // 创建房间成功
                await this._lobbyConn.close();
                // TODO 构造房间内存对象

                this.transition('gameConnected');
                resolve();
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      },

      joinRoom(roomName, { expectedUserIds = null } = {}) {
        this.transition('lobbyToGame');
        return new Promise(async (resolve, reject) => {
          try {
            const joinRoomMsg = this._newJoinRoomMsg(roomName, {
              expectedUserIds,
            });
            const joinRoomResMsg = await this._lobbyConn.send(joinRoomMsg);
            if (joinRoomResMsg.reasonCode) {
              this._reject(joinRoomResMsg, reject);
            } else {
              joinRoomMsg.op = 'add';
              // 连接游戏服务器
              const gameServer =
                joinRoomResMsg.addr || joinRoomResMsg.secureAddr;
              await this._connectGameServer(gameServer);
              // 在游戏服务器上加入房间
              const gameJoinRoomResMsg = this._gameConn.send(joinRoomMsg);
              if (gameJoinRoomResMsg.reasonCode) {
                // 加入房间失败
                await this._gameConn.close();
                this._reject(gameJoinRoomResMsg, reject);
              } else {
                // 加入房间成功
                await this._lobbyConn.close();
                // TODO 构建房间内存对象

                this.transition('gameConnected');
                resolve();
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      },

      joinOrCreateRoom(
        roomName,
        { roomOptions = null, expectedUserIds = null } = {}
      ) {
        this.transition('lobbyToGame');
        return new Promise(async (resolve, reject) => {
          try {
            const joinOrCreateRoomMsg = this._newJoinOrCreateRoomMsg(roomName, {
              roomOptions,
              expectedUserIds,
            });
            const joinOrCreateRoomResMsg = await this._lobbyConn.send(
              joinOrCreateRoomMsg
            );
            if (joinOrCreateRoomResMsg.reasonCode) {
              this._reject(joinOrCreateRoomResMsg, reject);
            } else {
              // TODO 区分创建还是加入
            }
          } catch (err) {
            reject(err);
          }
        });
      },

      joinRandomRoom({ matchProperties = null, expectedUserIds = null } = {}) {
        this.transition('lobbyToGame');
        return new Promise(async (resolve, reject) => {
          try {
            const joinRandomRoomMsg = this._newJoinRandomRoomMsg({
              matchProperties,
              expectedUserIds,
            });
            const joinRandomRoomResMsg = await this._lobbyConn.send(
              joinRandomRoomMsg
            );
            if (joinRandomRoomResMsg.reasonCode) {
              this._reject(joinRandomRoomResMsg, reject);
            } else {
              // 连接游戏服务器
              const gameServer =
                joinRandomRoomResMsg.addr || joinRandomRoomResMsg.secureAddr;
              await this._connectGameServer(gameServer);
              const joinRoomMsgForGame = this._newJoinRoomMsgForGame(
                joinRandomRoomResMsg.cid,
                {
                  matchProperties,
                  expectedUserIds,
                }
              );
              const joinRoomResMsg = await this._gameConn.send(
                joinRoomMsgForGame
              );
              if (joinRoomResMsg.reasonCode) {
                // 加入房间失败
                await this._gameConn.close();
                this._reject(joinRoomResMsg, reject);
              } else {
                // 加入房间成功
                await this._lobbyConn.close();
                // TODO 构建房间内存对象

                this.transition('gameConnected');
                resolve();
              }
            }
          } catch (err) {
            reject(err);
          }
        });
      },

      disconnect() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._lobbyConn.close();
            this.transition('init');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },
    },

    lobbyToGame: {
      _onEnter() {
        debug('lobbyToGame _onEnter()');
      },
    },

    gameConnected: {
      _onEnter() {
        debug('gameConnected _onEnter()');
      },

      setRoomOpened(opened) {
        return new Promise(async (resolve, reject) => {
          try {
            const msg = {
              cmd: 'conv',
              op: 'open',
              toggle: opened,
            };
            await this._gameConn.send(msg);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      setRoomVisible(visible) {
        return new Promise(async (resolve, reject) => {
          try {
            const msg = {
              cmd: 'conv',
              op: 'visible',
              toggle: visible,
            };
            await this._gameConn.send(msg);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      setMaster(newMasterId) {
        return new Promise(async (resolve, reject) => {
          try {
            const msg = {
              cmd: 'conv',
              op: 'update-master-client',
              masterActorId: newMasterId,
            };
            await this._gameConn.send(msg);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

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
            await this._gameConn.send(msg);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      leaveRoom() {
        return new Promise(async (resolve, reject) => {
          try {
            const msg = {
              cmd: 'conv',
              op: 'remove',
              // TODO this.room
              cid: this.room.name,
            };
            await this._gameConn.send(msg);
            await this._gameConn.close();
            await this._lobbyConn.connect();
            const sessionMsg = this._newOpenLobbySessionMsg();
            const sessionResMsg = await this._lobbyConn.send(sessionMsg);
            if (sessionResMsg.reasonCode) {
              // TODO 关闭 socket 连接

              // TODO 抛出连接失败的事件

              const { reasonCode, detail } = sessionResMsg;
              reject(new Error(`${reasonCode}, ${detail}`));
            } else {
              this.transition('lobbyConnected');
              resolve();
            }
          } catch (err) {
            reject(err);
          }
        });
      },

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
            await this._gameConn.send(msg);
          } catch (err) {
            reject(err);
          }
        });
      },

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
            await this._gameConn.send(msg);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      disconnect() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._gameConn.close();
            this.transition('init');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },
    },
  },

  _connectGameServer(server) {
    return new Promise(async (resolve, reject) => {
      this._gameConn = new GameConnection(this._play.userId);
      await this._gameConn.connect(server);
      const sessionOpenMsg = this._newOpenGameSession();
      const sessionOpenResMsg = await this._gameConn.send(sessionOpenMsg);
      if (sessionOpenResMsg.reasonCode) {
        await this._gameConn.close();
        const { reasonCode, detail } = sessionOpenResMsg;
        reject(new Error(`${reasonCode}, ${detail}`));
      } else {
        resolve();
      }
    });
  },

  _reject(msg, reject) {
    const { reasonCode, detail } = msg;
    reject(new Error(`${reasonCode}, ${detail}`));
  },

  _newOpenLobbySessionMsg() {
    const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
    return {
      cmd: 'session',
      op: 'open',
      appId,
      peerId: userId,
      sdkVersion: PlayVersion,
      gameVersion,
    };
  },

  _newJoinLobbyMsg() {
    return {
      cmd: 'lobby',
      op: 'add',
    };
  },

  _newLeaveLobbyMsg() {
    return {
      cmd: 'lobby',
      op: 'remove',
    };
  },

  _newOpenGameSession() {
    return {
      cmd: 'session',
      op: 'open',
      appId: this._play._appId,
      peerId: this._play.userId,
      sdkVersion: PlayVersion,
      gameVersion: this._play._gameVersion,
    };
  },

  _newCreateRoomMsg({
    roomName = null,
    roomOptions = null,
    expectedUserIds = null,
  } = {}) {
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
    return msg;
  },

  _newJoinRoomMsg(roomName, { expectedUserIds = null } = {}) {
    // 加入房间的消息体
    const msg = {
      cmd: 'conv',
      op: 'add',
      cid: roomName,
    };
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    return msg;
  },

  _newJoinOrCreateRoomMsg(
    roomName,
    { roomOptions = null, expectedUserIds = null } = {}
  ) {
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
    return msg;
  },

  _newJoinOrCreateRoomMsgForGame(
    roomName,
    { roomOptions = null, expectedUserIds = null } = {}
  ) {
    let msg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
    };
    // 拷贝房间参数
    if (roomOptions != null) {
      const opts = convertRoomOptions(roomOptions);
      msg = Object.assign(msg, opts);
    }
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    return msg;
  },

  _newJoinRandomRoomMsg({
    matchProperties = null,
    expectedUserIds = null,
  } = {}) {
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
    return msg;
  },

  _newJoinRoomMsgForGame(
    roomName,
    { matchProperties = null, expectedUserIds = null } = {}
  ) {
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
    return msg;
  },
});

export default PlayFSM;
