import request from 'superagent';
import { debug, error } from './Logger';
import isWeapp from './Utils';
import AppRouter from './AppRouter';

export default class GameRouter {
  constructor({ appId, appKey, userId, server, feature }) {
    this._appId = appId;
    this._appKey = appKey;
    this._userId = userId;
    this._server = server;
    this._feature = feature;

    this._appRouter = new AppRouter({
      appId,
      server,
    });
    // 缓存的 Lobby 信息，包括地址和 token
    this._sessionToken = null;
    this._url = null;
    this._serverValidTimeStamp = 0;
  }

  // 鉴权
  authorize() {
    if (this._isValid()) {
      return Promise.resolve({
        url: this._url,
        sessionToken: this._sessionToken,
      });
    }
    return new Promise(async (resolve, reject) => {
      try {
        const gameRouterUrl = await this._appRouter.fetch();
        debug(gameRouterUrl);
        const data = {};
        if (isWeapp) {
          data.feature = 'wechat';
        }
        if (this._feature) {
          data.feature = this._feature;
        }
        const res = await request
          .post(gameRouterUrl)
          .set(this._getHeaders())
          .send(data);
        debug(res.text);
        const { sessionToken, lobbyAddr, ttl } = JSON.parse(res.text);
        this._sessionToken = sessionToken;
        this._url = lobbyAddr;
        this._serverValidTimeStamp = Date.now() + ttl * 1000;
        resolve({
          url: this._url,
          sessionToken: this._sessionToken,
        });
      } catch (e) {
        error(e);
        reject(e);
      }
    });
  }

  _isValid() {
    return (
      this._sessionToken != null &&
      this._url != null &&
      Date.now() < this._serverValidTimeStamp
    );
  }

  _getHeaders() {
    return {
      'X-LC-ID': this._appId,
      'X-LC-KEY': this._appKey,
      'X-LC-PLAY-USER-ID': this._userId,
      'Content-Type': 'application/json',
    };
  }
}
