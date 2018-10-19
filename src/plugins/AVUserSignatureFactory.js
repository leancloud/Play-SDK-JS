import request from 'superagent';

export default class AVSignFactory {
  /**
   * 初始化签名工厂
   * @param {Object} opts
   * @param {String} opts.appId
   * @param {String} opts.appKey
   * @param {AVUser} opts.avUser
   */
  constructor(opts) {
    const { appId, appKey, avUser } = opts;
    if (typeof appId !== 'string') {
      throw new TypeError('appId is not a string');
    }
    if (typeof appKey !== 'string') {
      throw new TypeError('appKey is not a string');
    }
    if (typeof avUser !== 'object') {
      throw new TypeError('avUser is not a object');
    }
    if (avUser.getSessionToken === undefined) {
      throw new Error('avUser donot has getSessionToken');
    }
    this._appId = appId;
    this._appKey = appKey;
    this._avUser = avUser;
  }

  /**
   * 通过 AVUser 请求签名
   * @param {AVUser} avUser
   */
  loginSignature() {
    if (this._appId === null) {
      return Promise.reject(new Error('no appId'));
    }
    if (this._appKey === null) {
      return Promise.reject(new Error('no appKey'));
    }
    if (this._avUser === null) {
      return Promise.reject(new Error('no avUser'));
    }
    return new Promise((resolve, reject) => {
      this._reject = reject;
      const subAppId = this._appId.slice(0, 8);
      this._req = request
        .post(`https://${subAppId}.api.lncld.net/1.1/play/sign`)
        .send({ session_token: this._avUser.getSessionToken() })
        .set('X-LC-Id', this._appId)
        .set('X-LC-Key', this._appKey)
        .end((err, res) => {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            const body = JSON.parse(res.text);
            const { nonce, timestamp, signature } = body;
            resolve({
              nonce,
              timestamp,
              signature,
            });
          }
        });
    });
  }

  /**
   * 中断请求
   */
  abort() {
    if (this._req) {
      this._req.abort();
      this._reject(new Error('abort'));
    }
  }
}
