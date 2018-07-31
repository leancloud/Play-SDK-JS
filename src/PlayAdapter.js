import WS from 'isomorphic-ws';

const DefaultWebSocket = url => new WS(url);

let WebSocket = DefaultWebSocket;

/**
 * 设置适配器
 * @param {Object} adapters
 * @param {Function} adapters.WebSocketAdapter WebSocket 适配器，Cocos Creator 打包 android 平台时需要传入 CA 证书
 */
function setAdapter({ WebSocketAdapter = null }) {
  WebSocket = WebSocketAdapter;
}

function getAdapater() {
  return {
    WebSocket,
  };
}

export { getAdapater, setAdapter };
