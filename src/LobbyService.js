import request from 'superagent';
import { debug, error } from './Logger';

import GameRouter from './GameRouter';
import { sdkVersion, protocolVersion } from './Config';

const SESSION_TOKEN_KEY = 'X-LC-PLAY-MULTIPLAYER-SESSION-TOKEN';

export default class LobbyService {
  constructor(opts) {
    this._opts = opts;
    const { appId, appKey, userId, playServer, feature } = opts;

    this._gameRouter = new GameRouter({
      appId,
      appKey,
      userId,
      server: playServer,
      feature,
    });

    this._defaultHeaders = {
      'X-LC-ID': appId,
      'X-LC-KEY': appKey,
      'X-LC-PLAY-USER-ID': userId,
      'Content-Type': 'application/json',
    };
  }

  authorize() {
    return this._gameRouter.authorize();
  }

  createRoom(roomName) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = `/1/multiplayer/lobby/room`;
        const fullUrl = `${url}${path}`;
        debug(fullUrl);
        const { gameVersion } = this._opts;
        const data = {
          gameVersion,
          sdkVersion,
          protocolVersion,
        };
        if (roomName) {
          data.cid = roomName;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ cid, addr });
      } catch (e) {
        error(JSON.stringify(e));
        // TODO 统一处理业务错误情况
        reject(e);
      }
    });
  }

  joinRoom({ roomName, expectedUserIds, rejoin, createOnNotFound }) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = `/1/multiplayer/lobby/room/${roomName}`;
        const fullUrl = `${url}${path}`;
        const { gameVersion } = this._opts;
        const data = {
          cid: roomName,
          gameVersion,
          sdkVersion,
          protocolVersion,
        };
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        if (rejoin !== undefined) {
          data.rejoin = rejoin;
        }
        if (createOnNotFound !== undefined) {
          data.createOnNotFound = createOnNotFound;
        }
        debug(JSON.stringify(data));
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr, roomCreated } = JSON.parse(res.text);
        resolve({ cid, addr, roomCreated });
      } catch (e) {
        error(JSON.stringify(e));
        // TODO 统一处理业务错误情况
        reject(e);
      }
    });
  }

  joinRandomRoom(matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = '/1/multiplayer/lobby/room/match';
        const fullUrl = `${url}${path}`;
        const { gameVersion } = this._opts;
        const data = {
          gameVersion,
          sdkVersion,
          protocolVersion,
        };
        if (matchProperties) {
          data.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ cid, addr });
      } catch (e) {
        error(JSON.stringify(e));
        reject(e);
      }
    });
  }

  matchRandom(piggybackPeerId, matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = '/1/multiplayer/lobby/room/match';
        const fullUrl = `${url}${path}`;
        const { gameVersion } = this._opts;
        const data = {
          gameVersion,
          sdkVersion,
          protocolVersion,
          piggybackPeerId,
        };
        if (matchProperties) {
          data.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        const res = await request
          .post(fullUrl)
          .set(this._defaultHeaders)
          .set(SESSION_TOKEN_KEY, sessionToken)
          .send(data);
        debug(res.text);
        const { cid, addr } = JSON.parse(res.text);
        resolve({ cid, addr });
      } catch (e) {
        error(JSON.stringify(e));
        reject(e);
      }
    });
  }
}
