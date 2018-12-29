import request from 'superagent';
import { debug } from './Logger';

export default class AppRouter {
  constructor(appId) {
    this._appId = appId;
    this._url = null;
    this._serverValidTimestamp = 0;
  }

  fetch() {
    return new Promise((resolve, reject) => {
      const now = Date.now();
      if (now < this._serverValidTimestamp) {
        // 在有效期内，则直接返回缓存数据
        debug(`get app router from cache: ${this._url}`);
        resolve(this._url);
      } else {
        this._fetch(resolve, reject);
      }
    });
  }

  _fetch(resolve, reject) {
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
            const { ttl, play_server: playServer } = body;
            this._url = `https://${playServer}/1/multiplayer/router/router`;
            this._serverValidTimestamp = Date.now() + ttl * 1000;
            debug(`server valid timestamp: ${this._serverValidTimestamp}`);
            debug(`get app router from server: ${this._url}`);
            resolve(this._url);
          }
        });
    } catch (err) {
      reject(err);
    }
  }

  abort() {
    if (this._httpReq) {
      this._httpReq.abort();
    }
  }
}
