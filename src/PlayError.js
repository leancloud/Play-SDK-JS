const PlayErrorCode = {
  // 位置错误类型
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  // 路由错误
  ROUTER_ERROR: 'ROUTER_ERROR',
  // 打开大厅会话错误
  OPEN_LOBBY_SESSION_ERROR: 'OPEN_LOBBY_SESSION_ERROR',
  // 打开游戏会话错误
  OPEN_GAME_SESSION_ERROR: 'OPEN_GAME_SESSION_ERROR',
  // 大厅创建房间错误
  LOBBY_CREATE_ROOM_ERROR: 'LOBBY_CREATE_ROOM_ERROR',
  // 连接游戏服务器失败
  CONNECT_GAME_SERVER_ERROR: 'CONNECT_GAME_SERVER_ERROR',
  // 游戏创建房间错误
  GAME_CREATE_ROOM_ERROR: 'GAME_CREATE_ROOM_ERROR',
};

class PlayError {
  constructor(code, message) {
    this._code = code;
    this._message = message;
  }
}

module.exports = {
  PlayErrorCode,
  PlayError,
};
