import request from 'superagent';
import { debug, error } from './Logger';

import GameRouter from './GameRouter';
import { sdkVersion, protocolVersion } from './Config';

const SESSION_TOKEN_KEY = 'X-LC-PLAY-MULTIPLAYER-SESSION-TOKEN';

export default class LobbyService {
  constructor(opts) {
    this._opts = opts;
    const { appId, appKey, userId, playServer, feature } = opts;
    this._appId = appId;
    this._appKey = appKey;
    this._userId = userId;
    this._feature = feature;

    this._gameRouter = new GameRouter({
      appId,
      appKey,
      userId,
      server: playServer,
      feature,
    });

    this._headers = {
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
        const data = {};
        if (roomName) {
          data.cid = roomName;
        }
        const res = await request
          .post(fullUrl)
          .set(this._headers)
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
        debug(`opts: ${JSON.stringify(this._opts)}`);
        const data = {
          cid: roomName,
          gameVersion: '0.0.1',
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
        const fullUrl = `${url}${path}`;
        const res = await request
          .post(fullUrl)
          .set(this._headers)
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

  joinRandomRoom(matchProperties, expectedUserIds) {
    return new Promise(async (resolve, reject) => {
      try {
        const { url, sessionToken } = await this._gameRouter.authorize();
        const path = '/1/multiplayer/lobby/room/match';
        const data = {
          gameVersion: '0.0.1',
          sdkVersion,
          protocolVersion,
        };
        if (matchProperties) {
          data.expectAttr = matchProperties;
        }
        if (expectedUserIds) {
          data.expectMembers = expectedUserIds;
        }
        const fullUrl = `${url}${path}`;
        const res = await request
          .post(fullUrl)
          .set(this._headers)
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
        const data = {
          gameVersion: '0.0.1',
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
        const fullUrl = `${url}${path}`;
        const res = await request
          .post(fullUrl)
          .set(this._headers)
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
