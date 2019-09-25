import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { debug } from './Logger';
import PlayFSM from './PlayFSM';
import ReceiverGroup from './ReceiverGroup';

import LobbyService from './LobbyService';
import GameConnection, {
  PLAYER_JOINED_EVENT,
  PLAYER_LEFT_EVENT,
  MASTER_CHANGED_EVENT,
  ROOM_OPEN_CHANGED_EVENT,
  ROOM_VISIBLE_CHANGED_EVENT,
  ROOM_PROPERTIES_CHANGED_EVENT,
  ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT,
  PLAYER_PROPERTIES_CHANGED_EVENT,
  PLAYER_OFFLINE_EVENT,
  PLAYER_ONLINE_EVENT,
  SEND_CUSTOM_EVENT,
  ROOM_KICKED_EVENT,
} from './GameConnection';

/**
 * 多人对战游戏服务的客户端
 * @param {Object} opts
 * @param {String} opts.userId 玩家唯一 Id
 * @param {String} opts.appId APP ID
 * @param {String} opts.appKey APP KEY
 * @param {Boolean} [opts.ssl] 是否使用 ssl，仅在 Client Engine 中可用
 * @param {String} [opts.gameVersion] 游戏版本号
 * @param {String} [opts.playServer] 路由地址
 */
export default class Client extends EventEmitter {
  constructor(opts) {
    super();
    if (!(typeof opts.appId === 'string')) {
      throw new TypeError(`${opts.appId} is not a string`);
    }
    if (!(typeof opts.appKey === 'string')) {
      throw new TypeError(`${opts.appKey} is not a string`);
    }
    if (!(typeof opts.userId === 'string')) {
      throw new TypeError(`${opts.userId} is not a string`);
    }
    if (opts.feature !== undefined && !(typeof opts.feature === 'string')) {
      throw new TypeError(`${opts.feature} is not a string`);
    }
    if (opts.ssl !== undefined && !(typeof opts.ssl === 'boolean')) {
      throw new TypeError(`${opts.ssl} is not a boolean`);
    }
    if (
      opts.gameVersion !== undefined &&
      !(typeof opts.gameVersion === 'string')
    ) {
      throw new TypeError(`${opts.gameVersion} is not a string`);
    }
    if (
      opts.playServer !== undefined &&
      !(typeof opts.playServer === 'string')
    ) {
      throw new TypeError(`${opts.playServer} is not a string`);
    }
    this._opts = opts;
    this._userId = opts.userId;
    this._appId = opts.appId;
    this._appKey = opts.appKey;
    this._feature = opts.feature;
    if (opts.ssl === false) {
      this._insecure = true;
    }
    if (opts.gameVersion) {
      this._gameVersion = opts.gameVersion;
    } else {
      this._gameVersion = '0.0.1';
    }
    this._playServer = opts.playServer;
    // fsm
    this._fsm = new PlayFSM({
      play: this,
    });
  }

  /**
   * 建立连接
   */
  connect() {
    this._lobbyService = new LobbyService(this._opts);
    return this._lobbyService.authorize();
  }

  /**
   * 重新连接
   */
  async reconnect() {
    return this._lobbyService.authorize();
  }

  /**
   * TODO 重新连接并自动加入房间
   */
  async reconnectAndRejoin() {
    if (_.isNull(this._lastRoomId)) {
      throw new Error('There is not room name for rejoin');
    }
    return this._fsm.handle('reconnectAndRejoin');
  }

  /**
   * TODO 关闭
   */
  async close() {
    debug('close');
    this._clear();
    return this._fsm.handle('close');
  }

  /**
   * TODO 加入大厅
   */
  async joinLobby() {
    return this._fsm.handle('joinLobby');
  }

  /**
   * TODO 离开大厅
   */
  async leaveLobby() {
    return this._fsm.handle('leaveLobby');
  }

  /**
   * 创建房间
   * @param {Object} [opts] 创建房间选项
   * @param {String} [opts.roomName] 房间名称，在整个游戏中唯一，默认值为 null，则由服务端分配一个唯一 Id
   * @param {Object} [opts.roomOptions] 创建房间选项，默认值为 null
   * @param {Boolean} [opts.roomOptions.open] 房间是否打开
   * @param {Boolean} [opts.roomOptions.visible] 房间是否可见，只有「可见」的房间会出现在房间列表里
   * @param {Number} [opts.roomOptions.emptyRoomTtl] 房间为空后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.playerTtl] 玩家掉线后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.maxPlayerCount] 最大玩家数量
   * @param {Object} [opts.roomOptions.customRoomProperties] 自定义房间属性
   * @param {Array.<String>} [opts.roomOptions.customRoomPropertyKeysForLobby] 在大厅中可获得的房间属性「键」数组
   * @param {CreateRoomFlag} [opts.roomOptions.flag] 创建房间标记，可多选
   * @param {Array.<String>} [opts.expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  async createRoom({
    roomName = null,
    roomOptions = null,
    expectedUserIds = null,
  } = {}) {
    if (roomName !== null && !(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (roomOptions !== null && !(roomOptions instanceof Object)) {
      throw new TypeError(`${roomOptions} is not a Object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an Array with string`);
    }
    const { cid, addr } = await this._lobbyService.createRoom(roomName);
    this._gameConnection = new GameConnection();
    const { sessionToken } = await this._lobbyService.authorize();
    await this._gameConnection.connect(addr, this._userId);
    await this._gameConnection.openSession(
      this._appId,
      this._userId,
      this._gameVersion,
      sessionToken
    );
    await this._gameConnection.createRoom(cid, roomOptions, expectedUserIds);
  }

  /**
   * 加入房间
   * @param {String} roomName 房间名称
   * @param {*} [expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  async joinRoom(roomName, { expectedUserIds = null } = {}) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    const { cid, addr } = await this._lobbyService.joinRoom(roomName);
    this._gameConnection = new GameConnection();
    await this._gameConnection.connect(addr, this._userId);
    await this._gameConnection.openSession(
      this._appId,
      this._userId,
      this._gameVersion
    );
    await this._gameConnection.joinRoom(cid, null, expectedUserIds);
  }

  /**
   * 重新加入房间
   * @param {String} roomName 房间名称
   */
  async rejoinRoom(roomName) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    return this._fsm.handle('rejoinRoom', roomName);
  }

  /**
   * 随机加入或创建房间
   * @param {String} roomName 房间名称
   * @param {Object} [opts] 创建房间选项
   * @param {Object} [opts.roomOptions] 创建房间选项，默认值为 null
   * @param {Boolean} [opts.roomOptions.open] 房间是否打开
   * @param {Boolean} [opts.roomOptions.visible] 房间是否可见，只有「可见」的房间会出现在房间列表里
   * @param {Number} [opts.roomOptions.emptyRoomTtl] 房间为空后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.playerTtl] 玩家掉线后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.maxPlayerCount] 最大玩家数量
   * @param {Object} [opts.roomOptions.customRoomProperties] 自定义房间属性
   * @param {Array.<String>} [opts.roomOptions.customRoomPropertyKeysForLobby] 在大厅中可获得的房间属性「键」数组
   * @param {CreateRoomFlag} [opts.roomOptions.flag] 创建房间标记，可多选
   * @param {Array.<String>} [opts.expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  async joinOrCreateRoom(
    roomName,
    { roomOptions = null, expectedUserIds = null } = {}
  ) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (roomOptions !== null && !(roomOptions instanceof Object)) {
      throw new TypeError(`${roomOptions} is not a Object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return this._fsm.handle(
      'joinOrCreateRoom',
      roomName,
      roomOptions,
      expectedUserIds
    );
  }

  /**
   * 随机加入房间
   * @param {Object} [opts] 随机加入房间选项
   * @param {Object} [opts.matchProperties] 匹配属性，默认值为 null
   */
  async joinRandomRoom({
    matchProperties = null,
    expectedUserIds = null,
  } = {}) {
    if (matchProperties !== null && !(typeof matchProperties === 'object')) {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return this._fsm.handle('joinRandomRoom', matchProperties, expectedUserIds);
  }

  /**
   * 随机匹配，匹配成功后并不加入房间，而是返回房间 id
   * @param {Object} [opts] 随机加入房间选项
   * @param {Object} [opts.matchProperties] 匹配属性，默认值为 null
   */
  async matchRandom(
    piggybackPeerId,
    { matchProperties = null, expectedUserIds = null } = {}
  ) {
    if (typeof piggybackPeerId !== 'string') {
      throw new Error(`${piggybackPeerId} is not a string`);
    }
    if (matchProperties !== null && !(typeof matchProperties === 'object')) {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return this._fsm.handle(
      'matchRandom',
      piggybackPeerId,
      matchProperties,
      expectedUserIds
    );
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} open 是否开启
   */
  async setRoomOpen(open) {
    if (!(typeof open === 'boolean')) {
      throw new TypeError(`${open} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._fsm.handle('setRoomOpen', open);
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  async setRoomVisible(visible) {
    if (!(typeof visible === 'boolean')) {
      throw new TypeError(`${visible} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._fsm.handle('setRoomVisible', visible);
  }

  /**
   * 设置房间允许的最大玩家数量
   * @param {*} count 数量
   */
  async setRoomMaxPlayerCount(count) {
    if (!(typeof count === 'number') || count < 1) {
      throw new TypeError(`${count} is not a positive number`);
    }
    return this._fsm.handle('setRoomMaxPlayerCount', count);
  }

  /**
   * 设置房间占位玩家 Id 列表
   * @param {*} expectedUserIds 玩家 Id 列表
   */
  async setRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._fsm.handle('setRoomExpectedUserIds', expectedUserIds);
  }

  /**
   * 清空房间占位玩家 Id 列表
   */
  async clearRoomExpectedUserIds() {
    return this._fsm.handle('clearRoomExpectedUserIds');
  }

  /**
   * 增加房间占位玩家 Id 列表
   * @param {*} expectedUserIds 增加的玩家 Id 列表
   */
  async addRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._fsm.handle('addRoomExpectedUserIds', expectedUserIds);
  }

  /**
   * 移除房间占位玩家 Id 列表
   * @param {*} expectedUserIds 移除的玩家 Id 列表
   */
  async removeRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._fsm.handle('removeRoomExpectedUserIds', expectedUserIds);
  }

  /**
   * 设置房主
   * @param {Number} newMasterId 新房主 ID
   */
  async setMaster(newMasterId) {
    if (!(typeof newMasterId === 'number')) {
      throw new TypeError(`${newMasterId} is not a number`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._fsm.handle('setMaster', newMasterId);
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
    if (this._room === null) {
      throw new Error('room is null');
    }
    if (this._player === null) {
      throw new Error('player is null');
    }
    return this._fsm.handle('sendEvent', eventId, eventData, options);
  }

  /**
   * 离开房间
   */
  async leaveRoom() {
    return this._fsm.handle('leaveRoom');
  }

  /**
   * 踢人
   * @param {Number} actorId 踢用户的 actorId
   * @param {Object} [opts] 附带参数
   * @param {Number} [opts.code] 编码
   * @param {String} [opts.msg] 附带信息
   */
  async kickPlayer(actorId, { code = null, msg = null } = {}) {
    if (!_.isNumber(actorId)) {
      throw new TypeError(`${actorId} is not a number`);
    }
    if (!_.isNull(code) && !_.isNumber(code)) {
      throw new TypeError(`${code} is not a number`);
    }
    if (!_.isNull(msg) && !_.isString(msg)) {
      throw new TypeError(`${msg} is not a string`);
    }
    return this._fsm.handle('kickPlayer', actorId, code, msg);
  }

  /**
   * 暂停消息队列处理
   * @return {void}
   */
  pauseMessageQueue() {
    this._fsm.handle('pauseMessageQueue');
  }

  /**
   * 恢复消息队列处理
   * @return {void}
   */
  resumeMessageQueue() {
    this._fsm.handle('resumeMessageQueue');
  }

  /**
   * 获取当前所在房间
   * @type {Room}
   * @readonly
   */
  get room() {
    return this._room;
  }

  /**
   * 获取当前玩家
   * @type {Player}
   * @readonly
   */
  get player() {
    return this._player;
  }

  /**
   * 获取房间列表
   * @type {Array.<LobbyRoom>}
   * @readonly
   */
  get lobbyRoomList() {
    return this._lobbyRoomList;
  }

  // 设置房间属性
  _setRoomCustomProperties(properties, expectedValues) {
    if (!(typeof properties === 'object')) {
      throw new TypeError(`${properties} is not an object`);
    }
    if (expectedValues && !(typeof expectedValues === 'object')) {
      throw new TypeError(`${expectedValues} is not an object`);
    }
    return this._fsm.handle(
      'setRoomCustomProperties',
      properties,
      expectedValues
    );
  }

  // 设置玩家属性
  _setPlayerCustomProperties(actorId, properties, expectedValues) {
    if (!(typeof actorId === 'number')) {
      throw new TypeError(`${actorId} is not a number`);
    }
    if (!(typeof properties === 'object')) {
      throw new TypeError(`${properties} is not an object`);
    }
    if (expectedValues && !(typeof expectedValues === 'object')) {
      throw new TypeError(`${expectedValues} is not an object`);
    }
    return this._fsm.handle(
      'setPlayerCustomProperties',
      actorId,
      properties,
      expectedValues
    );
  }

  // 清理内存数据
  _clear() {
    this.removeAllListeners();
    this._lobbyRoomList = null;
    this._masterServer = null;
    this._gameServer = null;
    this._room = null;
    this._player = null;
  }

  // 模拟断线
  _simulateDisconnection() {
    this._fsm.handle('_simulateDisconnection');
  }

  /**
   * 获取用户 id
   * @type {String}
   * @readonly
   */
  get userId() {
    return this._userId;
  }
}
