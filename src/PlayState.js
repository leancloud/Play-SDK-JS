/**
 * 连接状态
 */
const PlayState = {
  /**
   * 关闭
   */
  CLOSED: 'CLOSED',
  /**
   * 连接中
   */
  CONNECTING: 'CONNECTING',
  /**
   * 大厅连接成功
   */
  LOBBY_OPEN: 'LOBBY_OPEN',
  /**
   * 房间连接成功
   */
  GAME_OPEN: 'GAME_OPEN',
  /**
   * 关闭中
   */
  CLOSING: 'CLOSING',
};

export default PlayState;
