// 签名过期时间
const SIGNATURE_TIMEOUT = 60000;

let _nonce = null;
let _timestamp = 0;
let _signature = null;

let _signFactory = null;

/**
 * 签名工具
 */
const SignatureUtils = {
  init: signFactory => {
    if (signFactory.loginSignature === undefined) {
      throw new Error('signFactory.loginSignature is undefined');
    }
    if (typeof signFactory.loginSignature !== 'function') {
      throw new TypeError('signFactory.loginSignature is not a function');
    }
    if (signFactory.abort === undefined) {
      throw new Error('signFactory.abort is undefined');
    }
    if (typeof signFactory.abort !== 'function') {
      throw new TypeError('signFactory.abort is not a function');
    }
    _signFactory = signFactory;
  },

  getSignature: () =>
    new Promise((resolve, reject) => {
      if (_signFactory === null) {
        resolve(null, 0, null);
      } else {
        const now = new Date().getTime();
        const delta = now - this._signTimestamp;
        // 判断签名是否过期
        if (delta < SIGNATURE_TIMEOUT) {
          resolve(_nonce, _timestamp, _signature);
        } else {
          _signFactory
            .loginSignature()
            .then(sign => {
              // 缓存签名
              _nonce = sign.nonce;
              _timestamp = sign.timestamp;
              _signature = sign.signature;
              resolve(_nonce, _timestamp, _signature);
            })
            .catch(e => {
              reject(e);
            });
        }
      }
    }),

  abort: () => {
    _signFactory.abort();
  },
};

export default SignatureUtils;
