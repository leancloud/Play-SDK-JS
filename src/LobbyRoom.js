/**
 * 大厅房间数据类
 */
export default class LobbyRoom {
  constructor(lobbyRoomDTO) {
    this._roomName = lobbyRoomDTO.cid;
    this._maxPlayerCount = lobbyRoomDTO.maxMembers;
    this._expectedUserIds = lobbyRoomDTO.expectMembers;
    this._emptyRoomTtl = lobbyRoomDTO.emptyRoomTtl;
    this._playerTtl = lobbyRoomDTO.playerTtl;
    this._playerCount = lobbyRoomDTO.playerCount;
    this._visible = lobbyRoomDTO.visible;
    this._open = lobbyRoomDTO.open;
    this._customRoomProperties = lobbyRoomDTO.attr;
  }

  /**
   * 房间名称
   * @type {String}
   * @readonly
   */
  get roomName() {
    return this._roomName;
  }

  /**
   * 房间最大玩家数
   * @type {Number}
   * @readonly
   */
  get maxPlayerCount() {
    return this._maxPlayerCount;
  }

  /**
   * 邀请好友 ID 数组
   * @type {Array.<String>}
   * @readonly
   */
  get expectedUserIds() {
    return this._expectedUserIds;
  }

  /**
   * 房间置空后销毁时间（秒）
   * @type {Number}
   * @readonly
   */
  get emptyRoomTtl() {
    return this._emptyRoomTtl;
  }

  /**
   * 玩家离线后踢出房间时间（秒）
   * @type {Number}
   * @readonly
   */
  get playerTtl() {
    return this._playerTtl;
  }

  /**
   * 当前房间玩家数量
   * @type {Number}
   * @readonly
   */
  get playerCount() {
    return this._playerCount;
  }

  /**
   * 房间属性
   * @type {Object}
   * @readonly
   */
  get customRoomProperties() {
    return this._customRoomProperties;
  }

  /**
   * 房间是否可见
   * @type {Boolean}
   * @readonly
   */
  get visible() {
    return this._visible === true;
  }

  /**
   * 房间是否开启
   * @type {Boolean}
   * @readonly
   */
  get opened() {
    return this._open === true;
  }
}
