import machina from 'machina';

import { debug, warn, error } from './Logger';
import AppRouter from './AppRouter';
import LobbyConnection from './LobbyConnection';
import GameConnection from './GameConnection';
import { PlayVersion } from './Config';
import { PlayErrorCode, PlayError } from './PlayError';

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
            await this._lobbyConn.connect(
              this._primaryServer,
              this._play.userId
            );
            // 打开会话
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
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
    },

    connecting: {
      _onEnter() {
        debug('connecting _onEnter()');
      },
      async connectFailed() {
        // TODO 判断连接状态并关闭
        this._router.about();
        await this._lobbyConn.close();
        this.transition('init');
      },
    },

    lobbyConnected: {
      _onEnter() {
        debug('lobbyConnected _onEnter()');
      },

      joinLobby() {
        return this._lobbyConn.joinLobby();
      },

      leaveLobby() {
        return this._lobbyConn.leaveLobby();
      },

      createRoom({
        roomName = null,
        roomOptions = null,
        expectedUserIds = null,
      } = {}) {
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
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
            await this._gameConn.openSession(appId, userId, gameVersion);
            const gameRoomInfo = await this._gameConn.createRoom(
              cid,
              roomOptions,
              expectedUserIds
            );
            // TODO 使用 gameRoomInfo 实例化 Room 内存对象

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

      joinRoom(roomName, { expectedUserIds = null } = {}) {
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
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
            await this._gameConn.openSession(appId, userId, gameVersion);
            const gameRoomInfo = await this._gameConn.joinRoom(
              cid,
              expectedUserIds
            );
            // TODO 使用 gameRoomInfo 实例化 Room 内存对象

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

      joinOrCreateRoom(
        roomName,
        { roomOptions = null, expectedUserIds = null } = {}
      ) {
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
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
            await this._gameConn.openSession(appId, userId, gameVersion);
            let gameRoomInfo = null;
            if (op === 'started') {
              gameRoomInfo = await this._gameConn.createRoom(
                cid,
                roomOptions,
                expectedUserIds
              );
            } else if (op === 'added') {
              gameRoomInfo = await this._gameConn.joinRoom(
                cid,
                expectedUserIds
              );
            } else {
              throw new PlayError(
                PlayErrorCode.UNKNOWN_ERROR,
                `joinOrCreatrRoom error response: ${JSON.stringify(roomInfo)}`
              );
            }
            // TODO 使用 gameRoomInfo 实例化 Room 内存对象

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

      joinRandomRoom({ matchProperties = null, expectedUserIds = null } = {}) {
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
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
            await this._gameConn.openSession(appId, userId, gameVersion);
            const gameRoomInfo = await this._gameConn.joinRoom(
              cid,
              expectedUserIds
            );
            // TODO 使用 gameRoomInfo 实例化 Room 内存对象

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

      rejoinRoom(roomName) {
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
            const {
              _appId: appId,
              userId,
              _gameVersion: gameVersion,
            } = this._play;
            await this._gameConn.openSession(appId, userId, gameVersion);
            const gameRoomInfo = await this._gameConn.joinRoom(cid);
            // TODO 使用 gameRoomInfo 实例化 Room 内存对象

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

      disconnect() {
        return new Promise(async (resolve, reject) => {
          try {
            await this._lobbyConn.close();
            this.transition('init');
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
});

export default PlayFSM;
