/**
 * 事件
 * @readonly
 * @enum {string}
 */
const Event = {
  /** 连接成功 */
  CONNECTED: 'connected',
  /** 连接失败 */
  CONNECT_FAILED: 'connectFailed',
  /** 断开连接 */
  DISCONNECTED: 'disconnected',
  /** 加入到大厅 */
  LOBBY_JOINED: 'lobbyJoined',
  /** 离开大厅 */
  LOBBY_LEFT: 'lobbyLeft',
  /** 大厅房间列表变化 */
  LOBBY_ROOM_LIST_UPDATED: 'lobbyRoomListUpdate',
  /** 创建房间成功 */
  ROOM_CREATED: 'roomCreated',
  /** 创建房间失败 */
  ROOM_CREATE_FAILED: 'roomCreateFailed',
  /** 加入房间成功 */
  ROOM_JOINED: 'roomJoined',
  /** 加入房间失败 */
  ROOM_JOIN_FAILED: 'roomJoinFailed',
  /** 有新玩家加入房间 */
  PLAYER_ROOM_JOINED: 'newPlayerJoinedRoom',
  /** 有玩家离开房间 */
  PLAYER_ROOM_LEFT: 'playerLeftRoom',
  /** 玩家活跃属性变化 */
  PLAYER_ACTIVITY_CHANGED: 'playerActivityChanged',
  /** 主机变更 */
  MASTER_SWITCHED: 'masterSwitched',
  /** 离开房间 */
  ROOM_LEFT: 'roomLeft',
  /** 房间自定义属性变化 */
  ROOM_CUSTOM_PROPERTIES_CHANGED: 'roomCustomPropertiesChanged',
  /** 玩家自定义属性变化 */
  PLAYER_CUSTOM_PROPERTIES_CHANGED: 'playerCustomPropertiesChanged',
  /** 自定义事件 */
  CUSTOM_EVENT: 'customEvent',
  /** 错误事件 */
  ERROR: 'error',
};

export default Event;
