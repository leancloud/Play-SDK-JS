import LobbyService from './LobbyService';
import GameConnection from './GameConnection';
import Player from './Player';
import ReceiverGroup from './ReceiverGroup';

import { debug, error } from './Logger';
import { deserializeObject, serializeObject } from './CodecUtils';
import { tap } from './Utils';

/**
 * 房间类
 */
export default class Room {
  constructor(opts) {}

  async create({
    roomName = null,
    roomOptions = null,
    expectedUserIds = null,
  }) {
    if (roomName !== null && !(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (roomOptions !== null && !(roomOptions instanceof Object)) {
      throw new TypeError(`${roomOptions} is not a Object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an Array with string`);
    }
    try {
      const { cid, addr } = await this._lobbyService.createRoom(roomName);
      const { sessionToken } = await this._lobbyService.authorize();
      // 合并
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      const room = await this._gameConn.createRoom(
        cid,
        roomOptions,
        expectedUserIds
      );
      this._init(room);
    } catch (err) {
      debug(err.message);
      throw err;
    }
  }

  async join(roomName, { expectedUserIds = null }) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    try {
      const { cid, addr } = await this._lobbyService.joinRoom({ roomName });
      const { sessionToken } = await this._lobbyService.authorize();
      // TODO 合并
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      const room = await this._gameConn.joinRoom(cid, null, expectedUserIds);
      this._init(room);
    } catch (err) {
      throw err;
    }
  }

  async joinRandom(roomName, expectedUserIds) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    try {
      const { cid, addr } = await this._lobbyService.joinRoom({ roomName });
      const { sessionToken } = await this._lobbyService.authorize();
      // TODO 合并
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      const room = await this._gameConn.joinRoom(cid, null, expectedUserIds);
      this._init(room);
    } catch (err) {
      throw err;
    }
  }

  async rejoin(roomName) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    const { cid, addr } = await this._lobbyService.joinRoom({
      roomName,
      rejoin: true,
    });
    try {
      const { sessionToken } = await this._lobbyService.authorize();
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      const room = await this._gameConn.joinRoom(cid);
      this._init(room);
    } catch (err) {
      throw err;
    }
  }

  async joinOrCreate(roomName, roomOptions, expectedUserIds) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (roomOptions !== null && !(roomOptions instanceof Object)) {
      throw new TypeError(`${roomOptions} is not a Object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    try {
      const { cid, addr, roomCreated } = await this._lobbyService.joinRoom({
        roomName,
        createOnNotFound: true,
      });
      const { sessionToken } = await this._lobbyService.authorize();
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      // 根据返回确定是创建还是加入房间
      let room = null;
      if (roomCreated) {
        room = await this._gameConn.createRoom(
          cid,
          roomOptions,
          expectedUserIds
        );
      } else {
        room = await this._gameConn.joinRoom(cid, null, expectedUserIds);
      }
      this._init(room);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 离开房间
   */
  async leave() {
    try {
      await this._gameConn.leaveRoom();
    } catch (e) {
      throw e;
    }
    try {
      await this._gameConn.close();
    } catch (e) {
      error(JSON.stringify(e));
    }
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} open 是否开启
   */
  setOpen(open) {
    if (!(typeof open === 'boolean')) {
      throw new TypeError(`${open} is not a boolean value`);
    }
    return this._gameConn.setRoomOpen(open).then(
      tap(o => {
        this._mergeSystemProps({ open: o });
      })
    );
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  setVisible(visible) {
    if (!(typeof visible === 'boolean')) {
      throw new TypeError(`${visible} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._gameConn.setRoomVisible(visible).then(
      tap(v => {
        this._mergeSystemProps({ visible: v });
      })
    );
  }

  /**
   * 设置房间允许的最大玩家数量
   * @param {*} count 数量
   */
  setMaxPlayerCount(count) {
    if (!(typeof count === 'number') || count < 1) {
      throw new TypeError(`${count} is not a positive number`);
    }
    return this._gameConn.setRoomMaxPlayerCount(count).then(
      tap(c => {
        this._mergeSystemProps({ maxPlayerCount: c });
      })
    );
  }

  /**
   * 设置房间占位玩家 Id 列表
   * @param {*} expectedUserIds 玩家 Id 列表
   */
  setExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.setRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 清空房间占位玩家 Id 列表
   */
  clearExpectedUserIds() {
    return this._gameConn.clearRoomExpectedUserIds().then(
      tap(ids => {
        this._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 增加房间占位玩家 Id 列表
   * @param {*} expectedUserIds 增加的玩家 Id 列表
   */
  addExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.addRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 移除房间占位玩家 Id 列表
   * @param {*} expectedUserIds 移除的玩家 Id 列表
   */
  removeExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.removeRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 设置房主
   * @param {Number} newMasterId 新房主 ID
   */
  setMaster(newMasterId) {
    if (!(typeof newMasterId === 'number')) {
      throw new TypeError(`${newMasterId} is not a number`);
    }
    return this._gameConn.setMaster(newMasterId).then(
      tap(res => {
        const { masterActorId } = res;
        this._masterActorId = masterActorId;
      })
    );
  }

  /**
   * 发送自定义消息
   * @param {Number|String} eventId 事件 ID
   * @param {Object} eventData 事件参数
   * @param {Object} options 发送事件选项
   * @param {ReceiverGroup} options.receiverGroup 接收组
   * @param {Array.<Number>} options.targetActorIds 接收者 Id。如果设置，将会覆盖 receiverGroup
   */
  sendEvent(
    eventId,
    eventData = {},
    options = { receiverGroup: ReceiverGroup.All }
  ) {
    if (!(typeof eventId === 'number')) {
      throw new TypeError(`${eventId} is not a number`);
    }
    if (eventId < -128 || eventId > 127) {
      throw new Error('eventId must be [-128, 127]');
    }
    if (!(typeof eventData === 'object')) {
      throw new TypeError(`${eventData} is not an object`);
    }
    if (!(options instanceof Object)) {
      throw new TypeError(`${options} is not a Object`);
    }
    if (
      options.receiverGroup === undefined &&
      options.targetActorIds === undefined
    ) {
      throw new TypeError(`receiverGroup and targetActorIds are null`);
    }

    return this._gameConn.sendEvent(eventId, eventData, options);
  }

  _init(roomData) {
    this._name = roomData.getCid();
    this._open = roomData.getOpen().getValue();
    this._visible = roomData.getVisible().getValue();
    this._maxPlayerCount = roomData.getMaxMembers();
    this._masterActorId = roomData.getMasterActorId();
    this._expectedUserIds = roomData.getExpectMembersList();
    this._players = {};
    roomData.getMembersList().forEach(member => {
      const player = new Player();
      player._init(member);
      this._players[player.actorId] = player;
    });
    // 属性
    if (roomData.getAttr()) {
      this._properties = deserializeObject(roomData.getAttr());
    } else {
      this._properties = {};
    }
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
  get open() {
    return this._open;
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
   * @type {Player}
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
    if (actorId === 0) return null;
    const player = this._players[actorId];
    if (player === null) {
      throw new Error(`player with id:${actorId} not found`);
    }
    return player;
  }

  /**
   * 获取房间内的玩家列表
   * @type {Array.<Player>}
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
  setCustomProperties(properties, { expectedValues = null } = {}) {
    if (!(typeof properties === 'object')) {
      throw new TypeError(`${properties} is not an object`);
    }
    if (expectedValues && !(typeof expectedValues === 'object')) {
      throw new TypeError(`${expectedValues} is not an object`);
    }
    return this._gameConn
      .setRoomCustomProperties(properties, expectedValues)
      .then(
        tap(res => {
          const { attr } = res;
          if (attr) {
            // 如果属性没变化，服务端则不会下发 attr 属性
            this._mergeProperties(attr);
          }
        })
      );
  }

  /**
   * 获取自定义属性
   * @type {Object}
   * @readonly
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

  _mergeSystemProps(changedProps) {
    const { open, visible, maxPlayerCount, expectedUserIds } = changedProps;
    if (open !== undefined) {
      this._open = open;
    }
    if (visible !== undefined) {
      this._visible = visible;
    }
    if (maxPlayerCount !== undefined) {
      this._maxPlayerCount = maxPlayerCount;
    }
    if (expectedUserIds !== undefined) {
      this._expectedUserIds = expectedUserIds;
    }
  }
}
