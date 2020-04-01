import EventEmitter from 'eventemitter3';

import ReceiverGroup from './ReceiverGroup';

import LobbyService from './LobbyService';

import Room from './Room';
import Lobby from './Lobby';

const DEFAULT_GAME_VERSION = '0.0.1';

function isInternationalApp(appId) {
  const suffix = appId.slice(-9);
  return suffix === '-MdYXbMMI';
}

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
    if (opts.playServer === undefined && !isInternationalApp(opts.appId)) {
      throw new Error('Please init with your server url.');
    }
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
      this._gameVersion = DEFAULT_GAME_VERSION;
    }
    this._playServer = opts.playServer;
  }

  /**
   * 建立连接
   */
  connect() {
    this._lobbyService = new LobbyService(this);
    return this._lobbyService.authorize();
  }

  /**
   * 重新连接
   */
  async reconnect() {
    return this._lobbyService.authorize();
  }

  /**
   * 重新连接并自动加入房间
   */
  async reconnectAndRejoin() {
    if (!this.room) {
      throw new Error('You have no room.');
    }
    return this.rejoinRoom(this.room.name);
  }

  /**
   * 关闭
   */
  async close() {
    if (this._lobby) {
      await this._lobby.close();
    }
    if (this.room) {
      await this.room.close();
    }
    this._clear();
  }

  /**
   * 加入大厅
   */
  joinLobby() {
    if (this._lobby) {
      // 已经存在 Lobby 对象
      throw new Error('You are already in lobby.');
    }
    this._lobby = new Lobby(this);
    return this._lobby.join();
  }

  /**
   * 离开大厅
   */
  leaveLobby() {
    if (!this._lobby) {
      // 不存在 Lobby 对象
      throw new Error('You are not in lobby yet');
    }
    return this._lobby.leave();
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
    if (this.room) {
      // 判断当前处于游戏中
      throw new Error('You are already in room.');
    }
    if (this._lobby) {
      this._lobby.close();
    }
    this._room = new Room(this);
    await this.room.create(roomName, roomOptions, expectedUserIds);
    return this.room;
  }

  /**
   * 加入房间sss
   * @param {String} roomName 房间名称
   * @param {*} [expectedUserIds] 邀请好友 ID 数组，默认值为 null
   */
  async joinRoom(roomName, { expectedUserIds = null } = {}) {
    if (this.room) {
      // 判断当前处于游戏中
      throw new Error('You are already in room.');
    }
    if (this._lobby) {
      this._lobby.close();
    }
    this._room = new Room(this);
    await this.room.join(roomName, expectedUserIds);
    return this.room;
  }

  /**
   * 重新加入房间
   * @param {String} roomName 房间名称
   */
  async rejoinRoom(roomName) {
    if (this._lobby) {
      this._lobby.close();
    }
    this._room = new Room(this);
    await this.room.rejoin(roomName);
    return this.room;
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
    if (this.room) {
      // 判断当前处于游戏中
      throw new Error('You are already in room.');
    }
    if (this._lobby) {
      this._lobby.close();
    }
    this._room = new Room(this);
    await this.room.joinOrCreate(roomName, roomOptions, expectedUserIds);
    return this.room;
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
    if (this.room) {
      // 判断当前处于游戏中
      throw new Error('You are already in room.');
    }
    if (this._lobby) {
      this._lobby.close();
    }
    this._room = new Room(this);
    await this.room.joinRandom(matchProperties, expectedUserIds);
    return this.room;
  }

  /**
   * 随机匹配，匹配成功后并不加入房间，而是返回房间 id
   * @param {Object} [opts] 随机加入房间选项
   * @param {Object} [opts.matchProperties] 匹配属性，默认值为 null
   */
  matchRandom(
    piggybackPeerId,
    { matchProperties = null, expectedUserIds = null } = {}
  ) {
    return this._lobbyService.matchRandom(
      piggybackPeerId,
      matchProperties,
      expectedUserIds
    );
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} open 是否开启
   */
  setRoomOpen(open) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.setOpen(open);
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  setRoomVisible(visible) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.setVisible(visible);
  }

  /**
   * 设置房间允许的最大玩家数量
   * @param {*} count 数量
   */
  setRoomMaxPlayerCount(count) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.setMaxPlayerCount(count);
  }

  /**
   * 设置房间占位玩家 Id 列表
   * @param {*} expectedUserIds 玩家 Id 列表
   */
  setRoomExpectedUserIds(expectedUserIds) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.setExpectedUserIds(expectedUserIds);
  }

  /**
   * 清空房间占位玩家 Id 列表
   */
  clearRoomExpectedUserIds() {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.clearExpectedUserIds();
  }

  /**
   * 增加房间占位玩家 Id 列表
   * @param {*} expectedUserIds 增加的玩家 Id 列表
   */
  addRoomExpectedUserIds(expectedUserIds) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.addExpectedUserIds(expectedUserIds);
  }

  /**
   * 移除房间占位玩家 Id 列表
   * @param {*} expectedUserIds 移除的玩家 Id 列表
   */
  removeRoomExpectedUserIds(expectedUserIds) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.removeExpectedUserIds(expectedUserIds);
  }

  /**
   * 设置房主
   * @param {Number} newMasterId 新房主 ID
   */
  setMaster(newMasterId) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.setMaster(newMasterId);
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
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.sendEvent(eventId, eventData, options);
  }

  /**
   * 离开房间
   */
  async leaveRoom() {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    await this.room.leave();
  }

  /**
   * 踢人
   * @param {Number} actorId 踢用户的 actorId
   * @param {Object} [opts] 附带参数
   * @param {Number} [opts.code] 编码
   * @param {String} [opts.msg] 附带信息
   */
  kickPlayer(actorId, { code = null, msg = null } = {}) {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room.kickPlayer(actorId, code, msg);
  }

  /**
   * 暂停消息队列处理
   * @return {void}
   */
  pauseMessageQueue() {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    this.room.pauseMessageQueue();
  }

  /**
   * 恢复消息队列处理
   * @return {void}
   */
  resumeMessageQueue() {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    this.room.resumeMessageQueue();
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
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room._player;
  }

  /**
   * 获取房间列表
   * @type {Array.<LobbyRoom>}
   * @readonly
   */
  get lobbyRoomList() {
    if (!this._lobby) {
      throw new Error('You are not in lobby yet.s');
    }
    return this._lobby._lobbyRoomList;
  }

  // 清理内存数据
  _clear() {
    this.removeAllListeners();
    this._lobbyRoomList = null;
    this._masterServer = null;
    this._gameServer = null;
    this._lobby = null;
    this._room = null;
  }

  // 模拟断线
  _simulateDisconnection() {
    if (!this.room) {
      throw new Error('You are not in room yet.');
    }
    return this.room._simulateDisconnection();
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
