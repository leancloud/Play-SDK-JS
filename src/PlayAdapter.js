import WS from 'isomorphic-ws';

const DefaultWebSocket = url => new WS(url);

let WebSocket = DefaultWebSocket;

/**
 * 设置适配器
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
