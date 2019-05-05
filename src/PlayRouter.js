import request from 'superagent';
import { debug } from './Logger';

export default class PlayRouter {
  constructor(appId, playServer) {
    this._appId = appId;
    this._playServer = playServer;
    this._url = null;
    this._serverValidTimestamp = 0;
  }

  fetch() {
    // 私有部署和本地调试
    if (this._playServer !== undefined) {
      return Promise.resolve(`${this._playServer}/router`);
    }
    const now = Date.now();
    if (now < this._serverValidTimestamp) {
      // 在有效期内，则直接返回缓存数据
      debug(`get app router from cache: ${this._url}`);
      return Promise.resolve(this._url);
    }
    return this._fetch();
  }

  _fetch() {
    return new Promise((resolve, reject) => {
      try {
        const url = 'https://app-router.leancloud.cn/2/route';
        const payload = {
          appId: this._appId,
        };
        this._httpReq = request
          .get(url)
          .query(payload)
          .end((err, response) => {
            if (err) {
              reject(err);
            } else {
              const body = JSON.parse(response.text);
              const {
                ttl,
                play_server: secondaryServer,
                multiplayer_router_server: primaryServer,
              } = body;
              const routerServer = primaryServer || secondaryServer;
              if (routerServer === undefined) {
                reject(new Error('router server is null'));
              }
              this._url = `https://${routerServer}/1/multiplayer/router/router`;
              this._serverValidTimestamp = Date.now() + ttl * 1000;
              debug(`server valid timestamp: ${this._serverValidTimestamp}`);
              debug(`get app router from server: ${this._url}`);
              resolve(this._url);
            }
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  abort() {
    if (this._httpReq) {
      this._httpReq.abort();
    }
  }
}
