import request from 'superagent';

let _appId = null;
let _appKey = null;
let _avUser = null;

let req = null;

const AVUserSignatureFactory = {
  /**
   * 初始化签名工厂
   * @param {Object} opts
   * @param {String} opts.appId
   * @param {String} opts.appKey
   * @param {AVUser} opts.avUser
   */
  init: opts => {
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
    _appId = appId;
    _appKey = appKey;
    _avUser = avUser;
  },

  /**
   * 通过 AVUser 请求签名
   * @param {AVUser} avUser
   */
  loginSignature: () => {
    if (_appId === null) {
      return Promise.reject(new Error('no appId'));
    }
    if (_appKey === null) {
      return Promise.reject(new Error('no appKey'));
    }
    if (_avUser === null) {
      return Promise.reject(new Error('no avUser'));
    }
    return new Promise((resolve, reject) => {
      const subAppId = _appId.slice(0, 8);
      req = request
        .post(`https://${subAppId}.api.lncld.net/1.1/rtm/sign`)
        .send({ session_token: _avUser.getSessionToken() })
        .set('X-LC-Id', _appId)
        .set('X-LC-Key', _appKey)
        .end((err, res) => {
          if (err) {
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
  },

  /**
   * 中断请求
   */
  abort: () => {
    if (req) {
      req.abort();
    }
  },
};

export default AVUserSignatureFactory;
