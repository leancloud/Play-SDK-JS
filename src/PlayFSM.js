import machina from 'machina';
import _ from 'lodash';
import { debug } from './Logger';
import AppRouter from './AppRouter';
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
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import Event from './Event';

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
          } catch (err) {
            reject(err);
          }
        });
      },
    },

    connecting: {
      _onEnter() {
        debug('connecting _onEnter()');
      },
      async connectFailed() {
        // 判断连接状态并关闭
        this._router.about();
        await this._lobbyConn.close();
        this.transition('init');
      },
    },

    lobbyConnected: {
      _onEnter() {
        debug('lobbyConnected _onEnter()');
        this._lobbyConn.on(ROOM_LIST_UPDATED_EVENT, roomList => {
          this._play._lobbyRoomList = roomList;
          this._play.emit(Event.LOBBY_ROOM_LIST_UPDATED);
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
        debug(`${this._play.userId} disconnect lobby`);
        return new Promise(async (resolve, reject) => {
          try {
            await this._lobbyConn.close();
            this.transition('init');
            resolve();
          } catch (err) {
            if (err instanceof PlayError) {
              reject(err);
            } else {
              reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
            }
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
          this._play._room._removePlayer(player.actorId);
          this._play._room._addPlayer(player);
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
      },

      _onExit() {
        this._gameConn.removeAllListeners();
      },

      leaveRoom() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._gameConn.leaveRoom();
            await this._gameConn.close();
            await this._lobbyConn.connect();
            await this._lobbyConn.openSession();
            this.transition('lobbyConnected');
            resolve();
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
        debug(`${this._play.userId} disconnect game`);
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
    this.transition('connecting');
    return new Promise(async (resolve, reject) => {
      try {
        const serverInfo = await this._router.connect(this._play._gameVersion);
        const { primaryServer, secondaryServer } = serverInfo;
        debug(`AppRouter connect resolve ${primaryServer}, ${secondaryServer}`);
        this._primaryServer = primaryServer;
        this._secondaryServer = secondaryServer;
        // 与大厅建立连接
        await this._lobbyConn.connect(
          this._primaryServer,
          this._play.userId
        );
        // 打开会话
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._lobbyConn.openSession(appId, userId, gameVersion);
        this.transition('lobbyConnected');
        resolve();
      } catch (err) {
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
        this.handle('connectFailed');
      }
    });
  },

  _createRoom(roomName, roomOptions, expectedUserIds) {
    this.transition('lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.createRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play.userId
        );
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
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
        await this._gameConn.close();
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
      }
    });
  },

  _joinRoom(roomName, expectedUserIds) {
    this.transition('lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRoom(
          roomName,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play.userId
        );
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        const gameRoom = await this._gameConn.joinRoom(
          cid,
          null,
          expectedUserIds
        );
        debug('joining room...');
        this._initGame(gameRoom);
        debug('join room done');
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
        await this._gameConn.close();
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
      }
    });
  },

  _joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
    this.transition('lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinOrCreateRoom(
          roomName,
          roomOptions,
          expectedUserIds
        );
        const { op, cid, addr, secureAddr } = roomInfo;
        debug(`op: ${op}`);
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play.userId
        );
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        let gameRoom = null;
        if (op === 'started') {
          gameRoom = await this._gameConn.createRoom(
            cid,
            roomOptions,
            expectedUserIds
          );
        } else if (op === 'added') {
          gameRoom = await this._gameConn.joinRoom(cid, expectedUserIds);
        } else {
          throw new PlayError(
            PlayErrorCode.UNKNOWN_ERROR,
            `joinOrCreatrRoom error response: ${JSON.stringify(roomInfo)}`
          );
        }
        this._initGame(gameRoom);
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
        await this._gameConn.close();
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
      }
    });
  },

  _joinRandomRoom(matchProperties, expectedUserIds) {
    this.transition('lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.joinRandomRoom(
          matchProperties,
          expectedUserIds
        );
        const { cid, addr, secureAddr } = roomInfo;
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play.userId
        );
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        const gameRoom = await this._gameConn.joinRoom(cid, expectedUserIds);
        this._initGame(gameRoom);
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
        await this._gameConn.close();
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
      }
    });
  },

  _rejoinRoom(roomName) {
    this.transition('lobbyToGame');
    return new Promise(async (resolve, reject) => {
      try {
        const roomInfo = await this._lobbyConn.rejoinRoom(roomName);
        const { cid, addr, secureAddr } = roomInfo;
        const gameServer = addr || secureAddr;
        await this._gameConn.connect(
          gameServer,
          this._play.userId
        );
        const { _appId: appId, userId, _gameVersion: gameVersion } = this._play;
        await this._gameConn.openSession(appId, userId, gameVersion);
        const gameRoom = await this._gameConn.joinRoom(cid);
        this._initGame(gameRoom);
        await this._lobbyConn.close();
        this.transition('gameConnected');
        resolve();
      } catch (err) {
        await this._gameConn.close();
        if (err instanceof PlayError) {
          reject(err);
        } else {
          reject(new PlayError(PlayErrorCode.UNKNOWN_ERROR, err.message));
        }
      }
    });
  },

  _initGame(gameRoom) {
    this._play._room = gameRoom;
    /* eslint no-param-reassign: ["error", { "props": false }] */
    _.forEach(gameRoom.playerList, player => {
      if (player.userId === this._play.userId) {
        this._play._player = player;
        player._play = this._play;
      }
    });
  },
});

export default PlayFSM;
