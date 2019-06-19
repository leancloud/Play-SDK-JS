/**
 * 事件
 * @readonly
 * @enum {String}
 */
const Event = {
  /**
   * 连接成功
   * @event Play#CONNECTED
   */
  CONNECTED: 'connected',
  /**
   * 连接失败
   *
   * @event Play#CONNECT_FAILED
   * @param {Object} payload
   * @param {Number} payload.code
   * @param {String} payload.detail
   */
  CONNECT_FAILED: 'connectFailed',
  /**
   * 断开连接
   * @event Play#DISCONNECTED
   */
  DISCONNECTED: 'disconnected',
  /**
   * 加入到大厅
   * @event Play#LOBBY_JOINED
   */
  LOBBY_JOINED: 'lobbyJoined',
  /**
   * 离开大厅
   * @event Play#LOBBY_LEFT
   */
  LOBBY_LEFT: 'lobbyLeft',
  /**
   * 大厅房间列表变化
   * @event Play#LOBBY_ROOM_LIST_UPDATED
   */
  LOBBY_ROOM_LIST_UPDATED: 'lobbyRoomListUpdate',
  /**
   * 创建房间成功
   * @event Play#ROOM_CREATED
   */
  ROOM_CREATED: 'roomCreated',
  /**
   * 创建房间失败
   * @event Play#ROOM_CREATE_FAILED
   * @param {Object} payload
   * @param {Number} payload.code
   * @param {String} payload.detail
   */
  ROOM_CREATE_FAILED: 'roomCreateFailed',
  /**
   * 加入房间成功
   * @event Play#ROOM_JOINED
   */
  ROOM_JOINED: 'roomJoined',
  /**
   * 加入房间失败
   * @event Play#ROOM_JOIN_FAILED
   */
  ROOM_JOIN_FAILED: 'roomJoinFailed',
  /**
   * 有新玩家加入房间
   * @event Play#PLAYER_ROOM_JOINED
   * @param {Object} payload
   * @param {Player} payload.newPlayer
   */
  PLAYER_ROOM_JOINED: 'newPlayerJoinedRoom',
  /**
   * 有玩家离开房间
   * @event Play#PLAYER_ROOM_LEFT
   * @param {Object} payload
   * @param {Player} payload.leftPlayer
   */
  PLAYER_ROOM_LEFT: 'playerLeftRoom',
  /**
   * 玩家活跃属性变化
   * @event Play#PLAYER_ACTIVITY_CHANGED
   * @param {Object} payload
   * @param {Player} payload.player
   */
  PLAYER_ACTIVITY_CHANGED: 'playerActivityChanged',
  /**
   * 主机变更
   * @event Play#MASTER_SWITCHED
   * @param {Object} payload
   * @param {Player} payload.newMaster
   */
  MASTER_SWITCHED: 'masterSwitched',
  /**
   * 房间系统属性变化
   * @event Play#ROOM_SYSTEM_PROPERTIES_CHANGED
   * @param {Object} payload
   * @param {Object} payload.changedProps
   */
  ROOM_SYSTEM_PROPERTIES_CHANGED: 'roomSystemPropertiesChanged',
  /**
   * 房间「开启 / 关闭」
   * @event Play#ROOM_OPEN_CHANGED
   * @param {Object} payload
   * @param {Boolean} payload.open
   */
  ROOM_OPEN_CHANGED: 'roomOpenChanged',
  /**
   * 房间「可见 / 不可见」
   * @event Play#ROOM_VISIBLE_CHANGED
   * @param {Object} payload
   * @param {Boolean} payload.visible
   */
  ROOM_VISIBLE_CHANGED: 'roomVisibleChanged',
  /**
   * 离开房间
   * @event Play#ROOM_LEFT
   */
  ROOM_LEFT: 'roomLeft',
  /**
   * 被踢出房间
   * @event Play#ROOM_KICKED
   * @param {Object} payload
   * @param {Number} payload.code
   * @param {String} payload.msg
   */
  ROOM_KICKED: 'roomKicked',
  /**
   * 房间自定义属性变化
   * @event Play#ROOM_CUSTOM_PROPERTIES_CHANGED
   * @param {Object} payload
   * @param {Object} payload.changedProps
   */
  ROOM_CUSTOM_PROPERTIES_CHANGED: 'roomCustomPropertiesChanged',
  /**
   * 玩家自定义属性变化
   * @event Play#PLAYER_CUSTOM_PROPERTIES_CHANGED
   * @param {Object} payload
   * @param {Player} payload.player
   * @param {Object} payload.changedProps
   */
  PLAYER_CUSTOM_PROPERTIES_CHANGED: 'playerCustomPropertiesChanged',
  /**
   * 自定义事件
   * @event Play#CUSTOM_EVENT
   * @param {Object} payload
   * @param {Number|String} payload.eventId
   * @param {Object} payload.eventData
   * @param {Number} payload.senderId
   */
  CUSTOM_EVENT: 'customEvent',
  /**
   * 错误事件
   * @event Play#ERROR
   * @param {Object} payload
   * @param {Number} payload.code
   * @param {String} payload.detail
   */
  ERROR: 'error',
};

export default Event;
