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
  JOINED_LOBBY: 'joinedLobby',
  /** 离开大厅 */
  LEFT_LOBBY: 'leftLobby',
  /** 大厅房间列表变化 */
  LOBBY_ROOM_LIST_UPDATE: 'lobbyRoomListUpdate',
  /** 创建房间成功 */
  CREATED_ROOM: 'createdRoom',
  /** 创建房间失败 */
  CREATE_ROOM_FAILED: 'createRoomFailed',
  /** 加入房间成功 */
  JOINED_ROOM: 'joinedRoom',
  /** 加入房间失败 */
  JOIN_ROOM_FAILED: 'joinRoomFailed',
  /** 有新玩家加入房间 */
  NEW_PLAYER_JOINED_ROOM: 'newPlayerJoinedRoom',
  /** 有玩家离开房间 */
  PLAYER_LEFT_ROOM: 'playerLeftRoom',
  /** 玩家活跃属性变化 */
  PLAYER_ACTIVITY_CHANGED: 'playerActivityChanged',
  /** 主机变更 */
  MASTER_SWITCHED: 'masterSwitched',
  /** 离开房间 */
  LEFT_ROOM: 'leftRoom',
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
