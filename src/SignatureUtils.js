// 签名过期时间
const SIGNATURE_TIMEOUT = 60000;

let _nonce = null;
let _timestamp = 0;
let _signature = null;

let _signFactory = null;

/**
 * 签名工具
 */

function init(signFactory) {
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
}

function getSignature() {
  return new Promise((resolve, reject) => {
    if (_signFactory === null) {
      resolve(null);
    } else {
      const now = new Date().getTime();
      const delta = now - this._signTimestamp;
      // 判断签名是否过期
      if (delta < SIGNATURE_TIMEOUT) {
        resolve({
          nonce: _nonce,
          timestamp: _timestamp,
          signature: _signature,
        });
      } else {
        _signFactory
          .loginSignature()
          .then(sign => {
            // 缓存签名
            _nonce = sign.nonce;
            _timestamp = sign.timestamp;
            _signature = sign.signature;
            resolve({
              nonce: _nonce,
              timestamp: _timestamp,
              signature: _signature,
            });
          })
          .catch(e => {
            reject(e);
          });
      }
    }
  });
}

function abort() {
  if (_signFactory) {
    _signFactory.abort();
  }
}

export default {
  init,
  getSignature,
  abort,
};
