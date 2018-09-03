/**
 * 连接状态
 */
const PlayState = {
  /**
   * 关闭
   */
  CLOSED: 0,
  /**
   * 连接中
   */
  CONNECTING: 1,
  /**
   * 大厅连接成功
   */
  LOBBY_OPEN: 2,
  /**
   * 房间连接成功
   */
  GAME_OPEN: 3,
  /**
   * 关闭中
   */
  CLOSING: 4,
};

export default PlayState;
