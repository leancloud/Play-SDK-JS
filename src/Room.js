import Player from './Player';
import ReceiverGroup from './ReceiverGroup';

/**
 * 房间类
 */
export default class Room {
  /* eslint no-param-reassign: ["error", { "props": false }] */
  static _newFromJSONObject(roomJSONObject) {
    const room = new Room();
    room._name = roomJSONObject.cid;
    room._opened = roomJSONObject.open;
    room._visible = roomJSONObject.visible;
    room._maxPlayerCount = roomJSONObject.maxMembers;
    room._masterActorId = roomJSONObject.masterActorId;
    room._expectedUserIds = roomJSONObject.expectMembers;
    room._players = {};
    for (let i = 0; i < roomJSONObject.members.length; i += 1) {
      const playerDTO = roomJSONObject.members[i];
      const player = Player._newFromJSONObject(playerDTO);
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
   * @type {String}
   * @readonly
   */
  get name() {
    return this._name;
  }

  /**
   * 房间是否开启
   * @type {Boolean}
   * @readonly
   */
  get opened() {
    return this._opened;
  }

  /**
   * 房间是否可见
   * @type {Boolean}
   * @readonly
   */
  get visible() {
    return this._visible;
  }

  /**
   * 房间允许的最大玩家数量
   * @type {Number}
   * @readonly
   */
  get maxPlayerCount() {
    return this._maxPlayerCount;
  }

  /**
   * 获取房主
   * @readonly
   */
  get master() {
    return this.getPlayer(this.masterId);
  }

  /**
   * 房间主机玩家 ID
   * @type {Number}
   * @readonly
   */
  get masterId() {
    return this._masterActorId;
  }

  /**
   * 邀请的好友 ID 列表
   * @type {Array.<String>}
   * @readonly
   */
  get expectedUserIds() {
    return this._expectedUserIds;
  }

  /**
   * 根据 actorId 获取 Player 对象
   * @param {Number} actorId 玩家在房间中的 Id
   * @return {Player}
   */
  getPlayer(actorId) {
    if (!(typeof actorId === 'number')) {
      throw new TypeError(`${actorId} is not a number`);
    }
    if (actorId === -1) return null;
    const player = this._players[actorId];
    if (player === null) {
      throw new Error(`player with id:${actorId} not found`);
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
   * 设置房间的自定义属性
   * @param {Object} properties 自定义属性
   * @param {Object} [opts] 设置选项
   * @param {Object} [opts.expectedValues] 期望属性，用于 CAS 检测
   */
  async setCustomProperties(properties, { expectedValues = null } = {}) {
    return this._play._setRoomCustomProperties(properties, expectedValues);
  }

  /**
   * 获取自定义属性
   * @return {Object}
   */
  get customProperties() {
    return this._properties;
  }

  /**
   * 踢人
   * @param {Number} actorId 踢用户的 actorId
   * @param {Object} [opts] 附带参数
   * @param {Number} [opts.code] 编码
   * @param {String} [opts.msg] 附带信息
   */
  async kickPlayer(actorId, { code = null, msg = null } = {}) {
    return this._play.kickPlayer(actorId, { code, msg });
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} opened 是否开启
   */
  async setOpened(opened) {
    return this._play.setRoomOpened(opened);
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  async setVisible(visible) {
    return this._play.setRoomVisible(visible);
  }

  /**
   * 设置房主
   * @param {Number} newMasterId 新房主 ID
   */
  async setMaster(newMasterId) {
    return this._play.setMaster(newMasterId);
  }

  /**
   * 发送自定义消息
   * @param {Number|String} eventId 事件 ID
   * @param {Object} eventData 事件参数
   * @param {Object} options 发送事件选项
   * @param {ReceiverGroup} options.receiverGroup 接收组
   * @param {Array.<Number>} options.targetActorIds 接收者 Id。如果设置，将会覆盖 receiverGroup
   */
  async sendEvent(
    eventId,
    eventData = {},
    options = { receiverGroup: ReceiverGroup.All }
  ) {
    return this._play.sendEvent(eventId, eventData, options);
  }

  _addPlayer(newPlayer) {
    if (!(newPlayer instanceof Player)) {
      throw new TypeError(`${newPlayer} is not a Player`);
    }
    this._players[newPlayer.actorId] = newPlayer;
    newPlayer._play = this._play;
  }

  _removePlayer(actorId) {
    delete this._players[actorId];
  }

  _mergeProperties(changedProperties) {
    this._properties = Object.assign(this._properties, changedProperties);
  }
}
