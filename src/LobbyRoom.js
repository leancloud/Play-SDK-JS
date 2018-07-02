/**
 * 大厅房间数据类
 */
export default class LobbyRoom {
  /**
   * @param {Object} lobbyRoomDTO 大厅房间数据对象
   */
  constructor(lobbyRoomDTO) {
    /**
     * 房间名称
     * @type {string}
     */
    this._roomName = lobbyRoomDTO.cid;
    this._maxPlayerCount = lobbyRoomDTO.maxMembers;
    this._expectedUserIds = lobbyRoomDTO.expectMembers;
    this._emptyRoomTtl = lobbyRoomDTO.emptyRoomTtl;
    this._playerTtl = lobbyRoomDTO.playerTtl;
    this._playerCount = lobbyRoomDTO.playerCount;
    if (lobbyRoomDTO.attr) {
      this._customRoomPropertiesForLobby = lobbyRoomDTO.attr;
    }
  }

  /**
   * 房间名称
   */
  get roomName() {
    return this._roomName;
  }

  /**
   * 房间最大玩家数
   */
  get maxPlayerCount() {
    return this._maxPlayerCount;
  }

  /**
   * 邀请好友 ID 数组
   */
  get expectedUserIds() {
    return this._expectedUserIds;
  }

  /**
   * 房间置空后销毁时间（秒）
   */
  get emptyRoomTtl() {
    return this._emptyRoomTtl;
  }

  /**
   * 玩家离线后踢出房间时间（秒）
   */
  get playerTtl() {
    return this._playerTtl;
  }

  /**
   * 当前房间玩家数量
   */
  get playerCount() {
    return this._playerCount;
  }

  /**
   * 房间匹配属性
   */
  get customRoomPropertiesForLobby() {
    return this._customRoomPropertiesForLobby;
  }
}
