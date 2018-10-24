// 签名过期时间
const SIGNATURE_TIMEOUT = 60000;

/**
 * 签名工具
 */
export default class SignatureUtils {
  constructor(signFactory) {
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
    this._signFactory = signFactory;
  }

  getSignature() {
    return new Promise((resolve, reject) => {
      if (this._signFactory === null) {
        resolve(null);
      } else {
        const now = new Date().getTime();
        const delta = now - this._signTimestamp;
        // 判断签名是否过期
        if (delta < SIGNATURE_TIMEOUT) {
          resolve({
            nonce: this._nonce,
            timestamp: this._timestamp,
            signature: this._signature,
          });
        } else {
          this._signFactory
            .loginSignature()
            .then(sign => {
              // 缓存签名
              this._nonce = sign.nonce;
              this._timestamp = sign.timestamp;
              this._signature = sign.signature;
              resolve({
                nonce: this._nonce,
                timestamp: this._timestamp,
                signature: this._signature,
              });
            })
            .catch(e => {
              reject(e);
            });
        }
      }
    });
  }

  abort() {
    if (this._signFactory) {
      this._signFactory.abort();
    }
  }
}
