import machina from 'machina';
import _ from 'lodash';
import { debug } from './Logger';
import { ERROR_EVENT, DISCONNECT_EVENT } from './Connection';
import LobbyConnection, { ROOM_LIST_UPDATED_EVENT } from './LobbyConnection';
import GameConnection, {
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
  MASTER_CHANGED_EVENT,
  ROOM_OPEN_CHANGED_EVENT,
  ROOM_VISIBLE_CHANGED_EVENT,
  ROOM_PROPERTIES_CHANGED_EVENT,
  ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT,
  PLAYER_PROPERTIES_CHANGED_EVENT,
  PLAYER_OFFLINE_EVENT,
  PLAYER_ONLINE_EVENT,
  SEND_CUSTOM_EVENT,
  ROOM_KICKED_EVENT,
} from './GameConnection';
import Event from './Event';
import LobbyClient from './LobbyService';
import { tap } from './Utils';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';

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
        const { _appId, _appKey, _userId, _feature, _playServer } = this._play;
        this._lobbyClient = new LobbyClient({
          appId: _appId,
          appKey: _appKey,
          userId: _userId,
          server: _playServer,
          feature: _feature,
        });
      },

      onTransition(nextState) {
        if (nextState === 'connecting' || nextState === 'close') {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from init to ${nextState}`);
        }
      },

      connect() {
        this.handle('onTransition', 'connecting');
        this._lobbyConn = new LobbyConnection();
        this._gameConn = new GameConnection();
        return this._connectLobby().then(
          tap(() => this.handle('onTransition', 'lobby'))
        );
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on init state`
        );
      },
    },

    connecting: {
      onTransition(nextState) {
        if (
          nextState === 'lobby' ||
          nextState === 'disconnect' ||
          nextState === 'close'
        ) {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from connecting to ${nextState}`);
        }
      },

      connect() {},

      close() {
        this.transition('close');
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on connecting state`
        );
      },
    },

    lobby: {
      _onEnter() {
        debug('lobby _onEnter()');
        this._lobbyConn.on(ERROR_EVENT, async ({ code, detail }) => {
          this._lobbyConn.close();
          this._play.emit(Event.ERROR, {
            code,
            detail,
          });
        });
        this._lobbyConn.on(ROOM_LIST_UPDATED_EVENT, roomList => {
          this._play._lobbyRoomList = roomList;
          this._play.emit(Event.LOBBY_ROOM_LIST_UPDATED);
        });
        this._lobbyConn.on(DISCONNECT_EVENT, () => {
          this.handle('onTransition', 'disconnect');
        });
      },

      _onExit() {
        this._lobbyConn.removeAllListeners();
      },

      onTransition(nextState) {
        if (
          nextState === 'lobbyToGame' ||
          nextState === 'disconnect' ||
          nextState === 'close'
        ) {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from lobby to ${nextState}`);
        }
      },

      joinLobby() {
        return this._lobbyConn.joinLobby();
      },

      leaveLobby() {
        return this._lobbyConn.leaveLobby();
      },

      createRoom(roomName, roomOptions, expectedUserIds) {
        return this._createRoom(roomName, roomOptions, expectedUserIds);
      },

      joinRoom(roomName, expectedUserIds) {
        return this._joinRoom(roomName, expectedUserIds);
      },

      joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
        return this._joinOrCreateRoom(roomName, roomOptions, expectedUserIds);
      },

      joinRandomRoom(matchProperties, expectedUserIds) {
        return this._joinRandomRoom(matchProperties, expectedUserIds);
      },

      rejoinRoom(roomName) {
        return this._rejoinRoom(roomName);
      },

      matchRandom(piggybackPeerId, matchProperties, expectedUserIds) {
        return this._lobbyConn.matchRandom(
          piggybackPeerId,
          matchProperties,
          expectedUserIds
        );
      },

      close() {
        return new Promise(async (resolve, reject) => {
          try {
            this._lobbyConn.close();
            this.transition('close');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      pauseMessageQueue() {
        this._lobbyConn._pauseMessageQueue();
      },

      resumeMessageQueue() {
        this._lobbyConn._resumeMessageQueue();
      },

      _simulateDisconnection() {
        this._lobbyConn._simulateDisconnection();
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on lobby state`
        );
      },
    },

    lobbyToGame: {
      onTransition(nextState) {
        if (
          nextState === 'lobby' ||
          nextState === 'game' ||
          nextState === 'disconnect' ||
          nextState === 'close'
        ) {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from lobbyToGame to ${nextState}`);
        }
      },

      close() {
        this.transition('close');
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on lobbyToGame state`
        );
      },
    },

    game: {
      _onEnter() {
        debug('game _onEnter()');
        // 为 reconnectAndRejoin() 保存房间 id
        this._play._lastRoomId = this._play.room.name;
        // 注册事件
        this._gameConn.on(ERROR_EVENT, async ({ code, detail }) => {
          this._gameConn.close();
          this._play.emit(Event.ERROR, {
            code,
            detail,
          });
        });
        this._gameConn.on(PLAYER_JOINED_EVENT, newPlayer => {
          this._play._room._addPlayer(newPlayer);
          newPlayer._room = this._play._room;
          this._play.emit(Event.PLAYER_ROOM_JOINED, {
            newPlayer,
          });
        });
        this._gameConn.on(PLAYER_LEFT_EVENT, actorId => {
          const leftPlayer = this._play._room.getPlayer(actorId);
          this._play._room._removePlayer(actorId);
          this._play.emit(Event.PLAYER_ROOM_LEFT, {
            leftPlayer,
          });
        });
        this._gameConn.on(MASTER_CHANGED_EVENT, newMasterActorId => {
          let newMaster = null;
          this._play._room._masterActorId = newMasterActorId;
          if (newMasterActorId > 0) {
            newMaster = this._play._room.getPlayer(newMasterActorId);
          }
          this._play.emit(Event.MASTER_SWITCHED, {
            newMaster,
          });
        });
        this._gameConn.on(ROOM_OPEN_CHANGED_EVENT, open => {
          this._play._room._open = open;
          this._play.emit(Event.ROOM_OPEN_CHANGED, {
            open,
          });
        });
        this._gameConn.on(ROOM_VISIBLE_CHANGED_EVENT, visible => {
          this._play._room._visible = visible;
          this._play.emit(Event.ROOM_VISIBLE_CHANGED, {
            visible,
          });
        });
        this._gameConn.on(ROOM_PROPERTIES_CHANGED_EVENT, changedProps => {
          this._play._room._mergeProperties(changedProps);
          this._play.emit(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, {
            changedProps,
          });
        });
        this._gameConn.on(
          ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT,
          changedProps => {
            this._play._room._mergeSystemProps(changedProps);
            this._play.emit(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, {
              changedProps,
            });
          }
        );
        this._gameConn.on(
          PLAYER_PROPERTIES_CHANGED_EVENT,
          (actorId, changedProps) => {
            debug(`actorId: ${actorId}`);
            debug(`changedProps: ${JSON.stringify(changedProps)}`);
            const player = this._play._room.getPlayer(actorId);
            player._mergeProperties(changedProps);
            this._play.emit(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, {
              player,
              changedProps,
            });
          }
        );
        this._gameConn.on(PLAYER_OFFLINE_EVENT, actorId => {
          const player = this._play._room.getPlayer(actorId);
          player._active = false;
          this._play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
            player,
          });
        });
        this._gameConn.on(PLAYER_ONLINE_EVENT, (actorId, props) => {
          const player = this._play._room.getPlayer(actorId);
          player._mergeProperties(props);
          player._active = true;
          this._play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
            player,
          });
        });
        this._gameConn.on(SEND_CUSTOM_EVENT, (eventId, eventData, senderId) => {
          this._play.emit(Event.CUSTOM_EVENT, {
            eventId,
            eventData,
            senderId,
          });
        });
        this._gameConn.on(DISCONNECT_EVENT, () => {
          this.handle('onTransition', 'disconnect');
        });
        this._gameConn.on(ROOM_KICKED_EVENT, async info => {
          this.handle('onTransition', 'gameToLobby');
          this._gameConn.close();
          await this._connectLobby();
          this.handle('onTransition', 'lobby');
          if (info) {
            this._play.emit(Event.ROOM_KICKED, info);
          } else {
            this._play.emit(Event.ROOM_KICKED);
          }
        });
      },

      _onExit() {
        this._gameConn.removeAllListeners();
      },

      onTransition(nextState) {
        if (
          nextState === 'gameToLobby' ||
          nextState === 'disconnect' ||
          nextState === 'close'
        ) {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from game to ${nextState}`);
        }
      },

      leaveRoom() {
        this.handle('onTransition', 'gameToLobby');
        return new Promise(async (resolve, reject) => {
          try {
            await this._gameConn.leaveRoom();
            this._gameConn.close();
            await this._connectLobby().then(
              tap(() => {
                this.handle('onTransition', 'lobby');
              })
            );
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      setRoomOpen(open) {
        return this._gameConn.setRoomOpen(open).then(
          tap(o => {
            this._play._room._mergeSystemProps({ open: o });
          })
        );
      },

      setRoomVisible(visible) {
        return this._gameConn.setRoomVisible(visible).then(
          tap(v => {
            this._play._room._mergeSystemProps({ visible: v });
          })
        );
      },

      setRoomMaxPlayerCount(count) {
        return this._gameConn.setRoomMaxPlayerCount(count).then(
          tap(c => {
            this._play._room._mergeSystemProps({ maxPlayerCount: c });
          })
        );
      },

      setRoomExpectedUserIds(expectedUserIds) {
        return this._gameConn.setRoomExpectedUserIds(expectedUserIds).then(
          tap(ids => {
            this._play._room._mergeSystemProps({ expectedUserIds: ids });
          })
        );
      },

      clearRoomExpectedUserIds() {
        return this._gameConn.clearRoomExpectedUserIds().then(
          tap(ids => {
            this._play._room._mergeSystemProps({ expectedUserIds: ids });
          })
        );
      },

      addRoomExpectedUserIds(expectedUserIds) {
        return this._gameConn.addRoomExpectedUserIds(expectedUserIds).then(
          tap(ids => {
            this._play._room._mergeSystemProps({ expectedUserIds: ids });
          })
        );
      },

      removeRoomExpectedUserIds(expectedUserIds) {
        return this._gameConn.removeRoomExpectedUserIds(expectedUserIds).then(
          tap(ids => {
            this._play._room._mergeSystemProps({ expectedUserIds: ids });
          })
        );
      },

      setMaster(newMasterId) {
        return this._gameConn.setMaster(newMasterId).then(
          tap(res => {
            const { masterActorId } = res;
            this._play._room._masterActorId = masterActorId;
          })
        );
      },

      kickPlayer(actorId, code, msg) {
        return this._gameConn.kickPlayer(actorId, code, msg).then(
          tap(aId => {
            this._play._room._removePlayer(aId);
          })
        );
      },

      sendEvent(eventId, eventData, options) {
        return this._gameConn.sendEvent(eventId, eventData, options);
      },

      setRoomCustomProperties(properties, expectedValues) {
        return this._gameConn
          .setRoomCustomProperties(properties, expectedValues)
          .then(
            tap(res => {
              const { attr } = res;
              if (attr) {
                // 如果属性没变化，服务端则不会下发 attr 属性
                this._play._room._mergeProperties(attr);
              }
            })
          );
      },

      setPlayerCustomProperties(actorId, properties, expectedValues) {
        return this._gameConn
          .setPlayerCustomProperties(actorId, properties, expectedValues)
          .then(
            tap(res => {
              const { actorId: aId, attr } = res;
              if (aId && attr) {
                const player = this._play._room.getPlayer(aId);
                player._mergeProperties(attr);
              }
            })
          );
      },

      close() {
        return new Promise(async (resolve, reject) => {
          try {
            this._gameConn.close();
            this.transition('close');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },

      pauseMessageQueue() {
        this._gameConn._pauseMessageQueue();
      },

      resumeMessageQueue() {
        this._gameConn._resumeMessageQueue();
      },

      _simulateDisconnection() {
        this._gameConn._simulateDisconnection();
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on game state`
        );
      },
    },

    gameToLobby: {
      onTransition(nextState) {
        if (
          nextState === 'lobby' ||
          nextState === 'game' ||
          nextState === 'disconnect' ||
          nextState === 'close'
        ) {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from gameToLobby to ${nextState}`);
        }
      },

      close() {
        this.transition('close');
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on gameToLobby state`
        );
      },
    },

    disconnect: {
      _onEnter() {
        this._play.emit(Event.DISCONNECTED);
      },

      onTransition(nextState) {
        if (nextState === 'connecting' || nextState === 'close') {
          this.transition(nextState);
        } else {
          throw new Error(`Error transition: from disconnect to ${nextState}`);
        }
      },

      reconnect() {
        this.handle('onTransition', 'connecting');
        this._lobbyConn = new LobbyConnection();
        this._gameConn = new GameConnection();
        return this._connectLobby().then(
          tap(() => this.handle('onTransition', 'lobby'))
        );
      },

      reconnectAndRejoin() {
        this.handle('onTransition', 'connecting');
        this._lobbyConn = new LobbyConnection();
        this._gameConn = new GameConnection();
        return new Promise(async (resolve, reject) => {
          try {
            await this._connectLobby().then(
              tap(() => {
                this.handle('onTransition', 'lobby');
              })
            );
            const gameRoom = await this._joinRoom(this._play._lastRoomId);
            resolve(gameRoom);
          } catch (err) {
            reject(err);
          }
        });
      },

      close() {
        this.transition('close');
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on disconnect state`
        );
      },
    },

    close: {
      onTransition(nextState) {
        if (nextState === 'lobby') {
          this._lobbyConn.close();
        } else if (nextState === 'game') {
          this._gameConn.close();
        }
      },

      '*': evt => {
        const { inputType } = evt;
        throw new PlayError(
          PlayErrorCode.STATE_ERROR,
          `you cannot call ${inputType} on close state`
        );
      },
    },
  },

  _createRoom(roomName, roomOptions, expectedUserIds) {
    this.handle('onTransition', 'lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.createRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        const gameRoom = await this._createGameRoom(
          cid,
          roomOptions,
          expectedUserIds
        );
        this.handle('onTransition', 'game');
        resolve(gameRoom);
      } catch (err) {
        this.handle('onTransition', 'lobby');
        reject(err);
      }
    });
  },

  _joinRoom(roomName, expectedUserIds) {
    this.handle('onTransition', 'lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRoom(
          roomName,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        const gameRoom = await this._joinGameRoom(cid, expectedUserIds);
        this.handle('onTransition', 'game');
        resolve(gameRoom);
      } catch (err) {
        this.handle('onTransition', 'lobby');
        reject(err);
      }
    });
  },

  _joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
    this.handle('onTransition', 'lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinOrCreateRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { op, cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        let gameRoom = null;
        if (op === 'create') {
          gameRoom = await this._createGameRoom(
            cid,
            roomOptions,
            expectedUserIds
          );
        } else {
          gameRoom = await this._joinGameRoom(cid, expectedUserIds);
        }
        this.handle('onTransition', 'game');
        resolve(gameRoom);
      } catch (err) {
        this.handle('onTransition', 'lobby');
        reject(err);
      }
    });
  },

  _joinRandomRoom(matchProperties, expectedUserIds) {
    this.handle('onTransition', 'lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRandomRoom(
          matchProperties,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        const gameRoom = await this._joinGameRoom(
          cid,
          expectedUserIds,
          matchProperties
        );
        this.handle('onTransition', 'game');
        resolve(gameRoom);
      } catch (err) {
        this.handle('onTransition', 'lobby');
        reject(err);
      }
    });
  },

  _rejoinRoom(roomName) {
    this.handle('onTransition', 'lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.rejoinRoom(roomName);
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        const gameRoom = await this._joinGameRoom(cid);
        this.handle('onTransition', 'game');
        resolve(gameRoom);
      } catch (err) {
        this.handle('onTransition', 'lobby');
        reject(err);
      }
    });
  },

  _connectLobby() {
    return new Promise(async (resolve, reject) => {
      try {
        // 先获取大厅路由地址
        await this._lobbyClient.authorize();
        // 再获取大厅服务器地址
        // const lobbyServerInfo = await this._router.fetch(lobbyRouterUrl);
        // const { primaryServer, secondaryServer } = lobbyServerInfo;
        // this._primaryServer = primaryServer;
        // this._secondaryServer = secondaryServer;
        // // 与大厅服务器建立连接
        // await this._lobbyConn.connect(this._primaryServer, this._play._userId);
      } catch (err) {
        reject(err);
      }
      // 打开大厅服务器会话
      const {
        _appId: appId,
        _userId: userId,
        _gameVersion: gameVersion,
      } = this._play;
      try {
        await this._lobbyConn.openSession(appId, userId, gameVersion);
        debug('opened session');
        resolve(this._play);
      } catch (err) {
        debug('open session failed');
        this._lobbyConn.close();
        reject(err);
      }
    });
  },

  _connectGame(addr, secureAddr) {
    return new Promise(async (resolve, reject) => {
      // 与游戏服务器建立连接
      try {
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(gameServer, this._play._userId);
      } catch (err) {
        reject(err);
      }
      // 打开游戏服务器会话
      try {
        const {
          _appId: appId,
          _userId: userId,
          _gameVersion: gameVersion,
        } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        resolve();
      } catch (err) {
        this._gameConn.close();
        reject(err);
      }
    });
  },

  _createGameRoom(cid, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const gameRoom = await this._gameConn.createRoom(
          cid,
          roomOptions,
          expectedUserIds
        );
        this._initGame(gameRoom);
        this._lobbyConn.close();
        resolve(gameRoom);
      } catch (err) {
        this._gameConn.close();
        reject(err);
      }
    });
  },

  _joinGameRoom(cid, expectedUserIds, matchProperties) {
    return new Promise(async (resolve, reject) => {
      try {
        const gameRoom = await this._gameConn.joinRoom(
          cid,
          matchProperties,
          expectedUserIds
        );
        this._initGame(gameRoom);
        this._lobbyConn.close();
        resolve(gameRoom);
      } catch (err) {
        this._gameConn.close();
        reject(err);
      }
    });
  },

  _initGame(gameRoom) {
    this._play._room = gameRoom;
    gameRoom._play = this._play;
    /* eslint no-param-reassign: ["error", { "props": false }] */
    _.forEach(gameRoom.playerList, player => {
      player._room = gameRoom;
      if (player.userId === this._play._userId) {
        this._play._player = player;
      }
    });
  },
});

export default PlayFSM;
