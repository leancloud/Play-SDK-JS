import WebSocket from 'isomorphic-ws';

export const adapters = {
  WebSocket,
};

/**
 * 设置适配器
 * @param {Object} newAdapters
 * @param {Function} newAdapters.WebSocketAdapter WebSocket 适配器，Cocos Creator 打包 android 平台时需要传入 CA 证书
 */
export function setAdapters(newAdapters) {
  Object.assign(adapters, newAdapters);
}
