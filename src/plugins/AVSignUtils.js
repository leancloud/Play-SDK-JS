import _ from 'lodash';
import AVSignFactory from './AVUserSignatureFactory';

/**
 * 使用 AVUser 签名的初始化方法
 * @param {Object} opts
 * @param {Object} opts.play Play 对象
 * @param {String} opts.appId APP ID
 */
function initPlayWithAVUserSign(opts) {
  const { play, avUser, appId, appKey } = opts;
  // 检测合法性
  if (!_.isObject(play)) {
    throw new Error(`${opts.play} is not an object`);
  }
  if (
    !_.isObject(avUser) ||
    avUser.objectId === undefined ||
    avUser.getSessionToken === undefined
  ) {
    throw new Error(`${opts.avUser} is not an AVUser`);
  }
  const signFactory = new AVSignFactory({
    appId,
    appKey,
    avUser,
  });
  const opt = Object.assign(opts, {
    signFactory,
  });
  play.init(opt);
  play.userId = avUser.objectId;
}

export default initPlayWithAVUserSign;
