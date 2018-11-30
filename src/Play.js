import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { debug } from './Logger';
import PlayFSM from './PlayFSM';

/**
 * Play 客户端类
 */
export default class Play extends EventEmitter {
  /**
   * 初始化客户端
   * @param {Object} opts
   * @param {String} opts.appId APP ID
   * @param {String} opts.appKey APP KEY
   * @param {Number} opts.region 节点地区
   * @param {Boolean} [opts.ssl] 是否使用 ssl，仅在 Client Engine 中可用
   */
  init(opts) {
    if (!(typeof opts.appId === 'string')) {
      throw new TypeError(`${opts.appId} is not a string`);
    }
    if (!(typeof opts.appKey === 'string')) {
      throw new TypeError(`${opts.appKey} is not a string`);
    }
    if (!(typeof opts.region === 'number')) {
      throw new TypeError(`${opts.region} is not a number`);
    }
    if (opts.feature !== undefined && !(typeof opts.feature === 'string')) {
      throw new TypeError(`${opts.feature} is not a string`);
    }
    if (opts.ssl !== undefined && !(typeof opts.ssl === 'boolean')) {
      throw new TypeError(`${opts.feature} is not a boolean`);
    }
    this._appId = opts.appId;
    this._appKey = opts.appKey;
    this._region = opts.region;
    this._feature = opts.feature;
    if (opts.ssl === false) {
      this._insecure = true;
    }
    /**
     * 玩家 ID
     * @type {string}
     */
    this.userId = null;
    this._clear();

    // fsm
    this._fsm = new PlayFSM({
      play: this,
    });
  }

  /**
   * 建立连接
   * @param {Object} [opts] 连接选项
   * @param {string} [opts.gameVersion] 游戏版本号，不同的游戏版本号将路由到不同的服务端，默认值为 0.0.1
   */
  connect({ gameVersion = '0.0.1' } = {}) {
    debug(`call connect(${gameVersion})`);
    // 判断是否有 userId
    if (_.isNull(this.userId)) {
      throw new Error('userId is null');
    }
    if (!_.isString(gameVersion)) {
      throw new TypeError(`${gameVersion} is not a string`);
    }
    this._gameVersion = gameVersion;
    return this._fsm.handle('connect');
  }

  /**
   * 重新连接
   */
  reconnect() {
    return this._fsm.handle('connect');
  }

  /**
   * 重新连接并自动加入房间
   */
  reconnectAndRejoin() {
    if (_.isNull(this._lastRoomId)) {
      throw new Error('There is not room name for rejoin');
    }
    return this._fsm.handle('reconnectAndRejoin');
  }

  /**
   * 断开连接
   */
  disconnect() {
    return this._fsm.handle('disconnect');
  }

  /**
   * 重置
   */
  reset() {
    debug('reset');
    this._clear();
    return this._fsm.handle('reset');
  }

  /**
   * 加入大厅，只有在 autoJoinLobby = false 时才需要调用
   */
  joinLobby() {
    return this._fsm.handle('joinLobby');
  }

  /**
   * 离开大厅
   */
  leaveLobby() {
    return this._fsm.handle('leaveLobby');
  }

  /**
   * 创建房间
   * @param {Object} [opts] 创建房间选项
   * @param {string} [opts.roomName] 房间名称，在整个游戏中唯一，默认值为 null，则由服务端分配一个唯一 Id
   * @param {Object} [opts.roomOptions] 创建房间选项，默认值为 null
   * @param {Boolean} [opts.roomOptions.opened] 房间是否打开
   * @param {Boolean} [opts.roomOptions.visible] 房间是否可见，只有「可见」的房间会出现在房间列表里
   * @param {Number} [opts.roomOptions.emptyRoomTtl] 房间为空后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.playerTtl] 玩家掉线后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.maxPlayerCount] 最大玩家数量
   * @param {Object} [opts.roomOptions.customRoomProperties] 自定义房间属性
   * @param {Array.<string>} [opts.roomOptions.customRoomPropertyKeysForLobby] 在大厅中可获得的房间属性「键」数组
   * @param {CreateRoomFlag} [opts.roomOptions.flag] 创建房间标记，可多选
   * @param {Array.<string>} [opts.expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  createRoom({
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
    debug('create room');
    return this._fsm.handle(
      'createRoom',
      roomName,
      roomOptions,
      expectedUserIds
    );
  }

  /**
   * 加入房间
   * @param {string} roomName 房间名称
   * @param {*} [expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  joinRoom(roomName, { expectedUserIds = null } = {}) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return this._fsm.handle('joinRoom', roomName, expectedUserIds);
  }

  /**
   * 重新加入房间
   * @param {string} roomName 房间名称
   */
  rejoinRoom(roomName) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    return this._fsm.handle('rejoinRoom', roomName);
  }

  /**
   * 随机加入或创建房间
   * @param {string} roomName 房间名称
   * @param {Object} [opts] 创建房间选项
   * @param {Object} [opts.roomOptions] 创建房间选项，默认值为 null
   * @param {Boolean} [opts.roomOptions.opened] 房间是否打开
   * @param {Boolean} [opts.roomOptions.visible] 房间是否可见，只有「可见」的房间会出现在房间列表里
   * @param {Number} [opts.roomOptions.emptyRoomTtl] 房间为空后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.playerTtl] 玩家掉线后，延迟销毁的时间
   * @param {Number} [opts.roomOptions.maxPlayerCount] 最大玩家数量
   * @param {Object} [opts.roomOptions.customRoomProperties] 自定义房间属性
   * @param {Array.<string>} [opts.roomOptions.customRoomPropertyKeysForLobby] 在大厅中可获得的房间属性「键」数组
   * @param {CreateRoomFlag} [opts.roomOptions.flag] 创建房间标记，可多选
   * @param {Array.<string>} [opts.expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  joinOrCreateRoom(
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
   * @param {Array.<string>} [opts.expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  joinRandomRoom({ matchProperties = null, expectedUserIds = null } = {}) {
    if (matchProperties !== null && !(typeof matchProperties === 'object')) {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    return this._fsm.handle('joinRandomRoom', matchProperties, expectedUserIds);
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} opened 是否开启
   */
  setRoomOpened(opened) {
    if (!(typeof opened === 'boolean')) {
      throw new TypeError(`${opened} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._fsm.handle('setRoomOpened', opened);
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  setRoomVisible(visible) {
    if (!(typeof visible === 'boolean')) {
      throw new TypeError(`${visible} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    return this._fsm.handle('setRoomVisible', visible);
  }

  /**
   * 设置房主
   * @param {number} newMasterId 新房主 ID
   */
  setMaster(newMasterId) {
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
   * @param {number|string} eventId 事件 ID
   * @param {Object} eventData 事件参数
   * @param {Object} options 发送事件选项
   * @param {ReceiverGroup} options.receiverGroup 接收组
   * @param {Array.<number>} options.targetActorIds 接收者 Id。如果设置，将会覆盖 receiverGroup
   */
  sendEvent(eventId, eventData, options) {
    if (!(typeof eventId === 'string') && !(typeof eventId === 'number')) {
      throw new TypeError(`${eventId} is not a string or number`);
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
  leaveRoom() {
    return this._fsm.handle('leaveRoom');
  }

  /**
   * 获取当前所在房间
   * @return {Room}
   * @readonly
   */
  get room() {
    return this._room;
  }

  /**
   * 获取当前玩家
   * @return {Player}
   * @readonly
   */
  get player() {
    return this._player;
  }

  /**
   * 获取房间列表
   * @return {Array.<LobbyRoom>}
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
    this._lobbyRoomList = null;
    this._masterServer = null;
    this._gameServer = null;
    this._room = null;
    this._player = null;
  }
}
