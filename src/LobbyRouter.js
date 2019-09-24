import request from 'superagent';
import { debug, error } from './Logger';
import { sdkVersion, protocolVersion } from './Config';
import isWeapp from './Utils';
import PlayRouter from './PlayRouter';

export default class LobbyRouter {
  constructor({ appId, appKey, userId, server, feature }) {
    this._appId = appId;
    this._appKey = appKey;
    this._userId = userId;
    this._server = server;
    this._feature = feature;

    // 包括 X-LC-ID, X-LC-KEY, X-LC-PLAY-MULTIPLAYER-SESSION-TOKEN, X-LC-PLAY-USER-ID, CONTENT-TYPE
    this._headers = {
      'X-LC-ID': appId,
      'X-LC-KEY': appKey,
      'X-LC-PLAY-USER-ID': userId,
      'Content-Type': 'application/json',
    };

    this._playRouter = new PlayRouter({
      appId,
      server,
    });

    this._sessionToken = null;
    this._url = null;
    this._serverValidTimeStamp = 0;
  }

  getLobbyInfo() {
    if (this._isValid) {
      return Promise.resolve({
        url: this._url,
        sessionToken: this._sessionToken,
      });
    }
    return this.authorize();
  }

  authorize() {
    return new Promise(async (resolve, reject) => {
      try {
        const lobbyRouterUrl = await this._playRouter.fetch();
        debug(lobbyRouterUrl);
        const res = await request
          .get(lobbyRouterUrl)
          .set(this._headers)
          .send({ feature: 'wechat' });
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
    const now = Date.now();
    return (
      this._sessionToken != null &&
      this.url != null &&
      now < this._serverValidTimeStamp
    );
  }

  fetch(url) {
    debug('LobbyRouter fetch');
    const now = Date.now();
    if (now < this._serverValidTimeStamp) {
      // 在有效期范围内，则不再请求，直接返回
      return Promise.resolve({
        primaryServer: this._primaryServer,
        secondaryServer: this._secondaryServer,
      });
    }
    if (now < this._nextConnectTimestamp) {
      // 判断连接间隔，如果在间隔内，则延迟连接
      const delayTime = this._nextConnectTimestamp - now;
      return this._delayFetch(url, delayTime);
    }
    // 直接获取
    return this._fetch(url);
  }

  _delayFetch(url, delay) {
    return new Promise((resolve, reject) => {
      debug(`delay: ${delay} for connect`);
      this._connectTimer = setTimeout(async () => {
        debug('connect time out');
        clearTimeout(this._connectTimer);
        this._connectTimer = null;
        try {
          const res = await this._fetch(url);
          resolve(res);
        } catch (err) {
          reject(err);
        }
      }, delay);
    });
  }

  _fetch(url) {
    debug(`fetch lobby server info from: ${url}`);
    return new Promise(async (resolve, reject) => {
      const query = { appId: this._appId, sdkVersion, protocolVersion };
      // 使用设置覆盖 SDK 判断的 feature
      if (this._feature) {
        query.feature = this._feature;
      } else if (isWeapp) {
        query.feature = 'wechat';
      }
      // 使用 ws
      if (this._insecure) {
        query.insecure = this._insecure;
      }
      try {
        const res = await request.get(url).query(query);
        const body = JSON.parse(res.text);
        debug(res.text);
        // 重置下次允许的连接时间
        this._connectFailedCount = 0;
        this._nextConnectTimestamp = 0;
        clearTimeout(this._connectTimer);
        this._connectTimer = null;
        const { server, secondary, ttl } = body;
        // 缓存
        this._primaryServer = server;
        this._secondaryServer = secondary;
        // ttl
        this._serverValidTimeStamp = Date.now() + ttl * 1000;
        resolve({
          primaryServer: this._primaryServer,
          secondaryServer: this._secondaryServer,
        });
      } catch (e) {
        // 连接失败，则增加下次连接时间间隔
        this._connectFailedCount += 1;
        this._nextConnectTimestamp =
          Date.now() + 2 ** this._connectFailedCount * 1000;
        reject(e);
      }
    });
  }
}
