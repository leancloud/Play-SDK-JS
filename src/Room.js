import Player from './Player';

/**
 * 房间类
 */
export default class Room {
  constructor(play) {
    this._play = play;
  }

  /* eslint no-param-reassign: ["error", { "props": false }] */
  static _newFromJSONObject(play, roomJSONObject) {
    const room = new Room(play);
    room._name = roomJSONObject.cid;
    room._opened = roomJSONObject.open;
    room._visible = roomJSONObject.visible;
    room._maxPlayerCount = roomJSONObject.maxMembers;
    room._masterActorId = roomJSONObject.masterActorId;
    room._expectedUserIds = roomJSONObject.expectMembers;
    room._players = {};
    for (let i = 0; i < roomJSONObject.members.length; i += 1) {
      const playerDTO = roomJSONObject.members[i];
      const player = Player._newFromJSONObject(play, playerDTO);
      if (player.userId === play.userId) {
        play._player = player;
      }
      room._players[player.actorId] = player;
    }
    if (roomJSONObject.attr) {
      room._properties = roomJSONObject.attr;
    } else {
      room._properties = {};
    }
    return room;
  }

  /**
   * 房间名称
   * @type {string}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * 房间是否开启
   * @type {boolean}
   * @readonly
   */
  get opened() {
    return this._opened;
  }

  /**
   * 房间是否可见
   * @type {boolean}
   * @readonly
   */
  get visible() {
    return this._visible;
  }

  /**
   * 房间允许的最大玩家数量
   * @type {number}
   * @readonly
   */
  get maxPlayerCount() {
    return this._maxPlayerCount;
  }

  /**
   * 房间主机玩家 ID
   * @type {number}
   * @readonly
   */
  get masterId() {
    return this._masterActorId;
  }

  /**
   * 邀请的好友 ID 列表
   * @type {Array.<string>}
   * @readonly
   */
  get expectedUserIds() {
    return this._expectedUserIds;
  }

  /**
   * 根据 actorId 获取 Player 对象
   * @param {number} actorId
   * @return {Player}
   */
  getPlayer(actorId) {
    if (!(typeof actorId === 'number')) {
      throw new TypeError(`${actorId} is not a number`);
    }
    const player = this._players[actorId];
    if (player === null) {
      throw new TypeError(`player with id:${actorId} not found`);
    }
    return player;
  }

  /**
   * 获取房间内的玩家列表
   * @return {Array.<Player>}
   * @readonly
   */
  get playerList() {
    return Object.values(this._players);
  }

  /**
   * 设置玩家的自定义属性
   * @param {Object} properties 自定义属性
   * @param {Object} expectedValues 期望属性，用于 CAS 检测
   */
  setCustomProperties(properties, { expectedValues = null } = {}) {
    this._play._setRoomCustomProperties(properties, expectedValues);
  }

  /**
   * 获取自定义属性
   * @return {Object}
   */
  getCustomProperties() {
    return this._properties;
  }

  _addPlayer(newPlayer) {
    if (!(newPlayer instanceof Player)) {
      throw new TypeError(`${newPlayer} is not a Player`);
    }
    this._players[newPlayer.actorId] = newPlayer;
  }

  _removePlayer(actorId) {
    delete this._players[actorId];
  }

  _mergeProperties(changedProperties) {
    this._properties = Object.assign(this._properties, changedProperties);
  }
}
