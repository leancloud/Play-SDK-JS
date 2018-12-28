import machina from 'machina';
import _ from 'lodash';
import { debug } from './Logger';
import LobbyRouter from './LobbyRouter';
import { ERROR_EVENT, DISCONNECT_EVENT } from './Connection';
import LobbyConnection, { ROOM_LIST_UPDATED_EVENT } from './LobbyConnection';
import GameConnection, {
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
  MASTER_CHANGED_EVENT,
  ROOM_OPEN_CHANGED_EVENT,
  ROOM_VISIBLE_CHANGED_EVENT,
  ROOM_PROPERTIES_CHANGED_EVENT,
  PLAYER_PROPERTIES_CHANGED_EVENT,
  PLAYER_OFFLINE_EVENT,
  PLAYER_ONLINE_EVENT,
  SEND_CUSTOM_EVENT,
} from './GameConnection';
import Event from './Event';
import PlayError from './PlayError';

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
        this._router = new LobbyRouter({
          appId: _appId,
          insecure: _insecure,
          feature: _feature,
        });
        this._lobbyConn = new LobbyConnection();
        this._gameConn = new GameConnection();
      },

      connect() {
        return this._connect();
      },

      reconnectAndRejoin() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._connect();
            await this._joinRoom(this._play._lastRoomId);
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },
    },

    // 连接 Router 状态
    connecting: {
      _onEnter() {
        debug(`${this._play._userId} connecting _onEnter()`);
        this._lobbyConn.on('ERROR_EVENT', ({ code, detail }) => {
          debug('lobby connection error event');
          this._play.emit(Event.ERROR, {
            code,
            detail,
          });
        });
      },
      reset() {
        return new Promise((resolve, reject) => {
          try {
            this._router.abort();
            this.transition('init');
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      },
    },

    // 连接 Lobby 状态
    lobbyConnecting: {
      reset() {
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

    lobbyOpening: {
      reset() {
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

    lobbyConnected: {
      _onEnter() {
        debug('lobbyConnected _onEnter()');
        this._lobbyConn.on(ROOM_LIST_UPDATED_EVENT, roomList => {
          this._play._lobbyRoomList = roomList;
          this._play.emit(Event.LOBBY_ROOM_LIST_UPDATED);
        });
        this._lobbyConn.on(DISCONNECT_EVENT, () => {
          this._play.emit(Event.DISCONNECTED);
        });
      },

      _onExit() {
        this._lobbyConn.removeAllListeners();
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

      disconnect() {
        debug(`${this._play._userId} disconnect lobby`);
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

      reset() {
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

    gameConnecting: {
      _onEnter() {
        debug('gameConnecting _onEnter()');
        this._gameConn.on(ERROR_EVENT, async ({ code, detail }) => {
          await this._gameConn.close();
          this._play.emit(Event.ERROR, {
            code,
            detail,
          });
        });
      },

      reset() {
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

    gameOpening: {
      reset() {
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

    gameConnected: {
      _onEnter() {
        debug('gameConnected _onEnter()');
        // 为 reconnectAndRejoin() 保存房间 id
        this._play._lastRoomId = this._play.room.name;
        this._gameConn.on(PLAYER_JOINED_EVENT, newPlayer => {
          this._play._room._addPlayer(newPlayer);
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
          if (newMasterActorId > -1) {
            newMaster = this._play._room.getPlayer(newMasterActorId);
          }
          this._play.emit(Event.MASTER_SWITCHED, {
            newMaster,
          });
        });
        this._gameConn.on(ROOM_OPEN_CHANGED_EVENT, open => {
          this._play.emit(Event.ROOM_OPEN_CHANGED, {
            opened: open,
          });
        });
        this._gameConn.on(ROOM_VISIBLE_CHANGED_EVENT, visible => {
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
          PLAYER_PROPERTIES_CHANGED_EVENT,
          (actorId, changedProps) => {
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
          player._setActive(false);
          this._play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
            player,
          });
        });
        this._gameConn.on(PLAYER_ONLINE_EVENT, player => {
          const p = this._play._room.getPlayer(player.actorId);
          Object.assign(p, player);
          p._setActive(true);
          this._play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
            player: p,
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
          this._play.emit(Event.DISCONNECTED);
        });
      },

      _onExit() {
        this._gameConn.removeAllListeners();
      },

      leaveRoom() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._gameConn.leaveRoom();
            await this._gameConn.close();
            await this._connectLobby();
            resolve();
            this._play.emit(Event.ROOM_LEFT);
          } catch (err) {
            reject(err);
          }
        });
      },

      setRoomOpened(opened) {
        return this._gameConn.setRoomOpened(opened);
      },

      setRoomVisible(visible) {
        return this._gameConn.setRoomVisible(visible);
      },

      setMaster(newMasterId) {
        return this._gameConn.setMaster(newMasterId);
      },

      sendEvent(eventId, eventData, options) {
        return this._gameConn.sendEvent(eventId, eventData, options);
      },

      setRoomCustomProperties(properties, expectedValues) {
        return this._gameConn.setRoomCustomProperties(
          properties,
          expectedValues
        );
      },

      setPlayerCustomProperties(actorId, properties, expectedValues) {
        return this._gameConn.setPlayerCustomProperties(
          actorId,
          properties,
          expectedValues
        );
      },

      disconnect() {
        debug(`${this._play._userId} disconnect game`);
        return new Promise(async (resolve, reject) => {
          try {
            await this._gameConn.close();
            this.transition('init');
            resolve();
            this._play.emit(Event.DISCONNECTED);
          } catch (err) {
            reject(err);
          }
        });
      },

      reset() {
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

  _connect() {
    return this._connectLobby();
  },

  _createRoom(roomName, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.createRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        await this._createGameRoom(cid, roomOptions, expectedUserIds);
        resolve();
      } catch (err) {
        this.transition('lobbyConnected');
        reject(err);
      }
    });
  },

  _joinRoom(roomName, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRoom(
          roomName,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        await this._joinGameRoom(cid, expectedUserIds);
        resolve();
      } catch (err) {
        this.transition('lobbyConnected');
        reject(err);
      }
    });
  },

  _joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinOrCreateRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { op, cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        if (op === 'started') {
          await this._createGameRoom(cid, roomOptions, expectedUserIds);
          resolve();
        } else {
          await this._joinGameRoom(cid, expectedUserIds);
          resolve();
        }
      } catch (err) {
        this.transition('lobbyConnected');
        reject(err);
      }
    });
  },

  _joinRandomRoom(matchProperties, expectedUserIds) {
    this.transition('gameConnecting');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRandomRoom(
          matchProperties,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        await this._joinGameRoom(cid, expectedUserIds, matchProperties);
        resolve();
      } catch (err) {
        this.transition('lobbyConnected');
        reject(err);
      }
    });
  },

  _rejoinRoom(roomName) {
    this.transition('gameConnecting');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.rejoinRoom(roomName);
        const { cid, addr, secureAddr } = roomInfo;
        await this._connectGame(addr, secureAddr);
        await this._joinGameRoom(cid);
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  },

  _connectLobby() {
    this.transition('connecting');
    return new Promise(async (resolve, reject) => {
      try {
        const serverInfo = await this._router.fetch(this._play._gameVersion);
        this.transition('lobbyConnecting');
        const { primaryServer, secondaryServer } = serverInfo;
        this._primaryServer = primaryServer;
        this._secondaryServer = secondaryServer;
        // 与大厅建立连接
        await this._lobbyConn.connect(
          this._primaryServer,
          this._play._userId
        );
        this.transition('lobbyOpening');
        // 打开会话
        const {
          _appId: appId,
          _userId: userId,
          _gameVersion: gameVersion,
        } = this._play;
        await this._lobbyConn.openSession(appId, userId, gameVersion);
        this.transition('lobbyConnected');
        resolve();
      } catch (err) {
        debug(`connect lobby error:`);
        debug(err instanceof PlayError);
        this.transition('init');
        reject(err);
      }
    });
  },

  _connectGame(addr, secureAddr) {
    this.transition('gameConnecting');
    return new Promise(async (resolve, reject) => {
      try {
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play._userId
        );
        this.transition('gameOpening');
        const {
          _appId: appId,
          _userId: userId,
          _gameVersion: gameVersion,
        } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        resolve();
      } catch (err) {
        this.transition('lobbyConnected');
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
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
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
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
        reject(err);
      }
    });
  },

  _initGame(gameRoom) {
    this._play._room = gameRoom;
    gameRoom._play = this._play;
    /* eslint no-param-reassign: ["error", { "props": false }] */
    _.forEach(gameRoom.playerList, player => {
      player._play = this._play;
      if (player.userId === this._play._userId) {
        this._play._player = player;
      }
    });
  },
});

export default PlayFSM;
