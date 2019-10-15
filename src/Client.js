import EventEmitter from 'eventemitter3';
import StateMachine from 'javascript-state-machine';

import { debug } from './Logger';
import PlayFSM from './PlayFSM';
import ReceiverGroup from './ReceiverGroup';

import { tap } from './Utils';

import LobbyService from './LobbyService';
import LobbyConnection from './LobbyConnection';
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

const STATE_INIT = 'init';
const STATE_JOINING = 'joining';
const STATE_GAME = 'game';
const STATE_DISCONNECTED = 'disconnected';

const TRANS_CREATE = 'create';
const TRANS_JOIN = 'join';
const TRANS_CREATED = 'created';
const TRANS_JOINED = 'joined';
const TRANS_CREATE_FAILED = 'createFailed';
const TRANS_JOIN_FAILED = 'joinFailed';
const TRANS_LEAVE = 'leave';
const TRANS_KICKED = 'kicked';
const TRANS_DISCONNECTED = 'disconnected';
const TRANS_REJOIN = 'rejoin';

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
    this._fsm = new StateMachine({
      init: 'init',
      transitions: [
        { name: 'create', from: 'init', to: 'room' },
        { name: 'join', from: 'init', to: 'room' },
        { name: 'rejoin', from: 'disconnected', to: 'room' },
        { name: 'close', from: '*', to: 'init' },
      ],
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
    if (this._lastRoomId == null || this._lastRoomId == undefined) {
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
    if (this._fsm.is('game')) {
      await this._gameConn.close();
    }
  }

  /**
   * TODO 加入大厅
   */
  async joinLobby() {
    this._lobbyConn = new LobbyConnection();
    const { sessionToken } = await this._lobbyService.authorize();
    await this._lobbyConn.connect(
      this._appId,
      this._playServer,
      this._gameVersion,
      this._userId,
      sessionToken
    );
    await this._lobbyConn.joinLobby();
  }

  /**
   * TODO 离开大厅
   */
  async leaveLobby() {
    await this._lobbyConn.close();
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
    if (this._fsm.cannot('create')) {
      throw new Error(`error state: ${this._fsm.state}`);
    }
    this._fsm.create();
    try {
      const { cid, addr } = await this._lobbyService.createRoom(roomName);
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
      await this._gameConn.createRoom(cid, roomOptions, expectedUserIds);
      this._fsm.created();
    } catch (err) {
      this._fsm.createFailed();
      throw err;
    }
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
    if (this._fsm.cannot('join')) {
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    this._fsm.join();
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
      await this._gameConn.joinRoom(cid, null, expectedUserIds);
      this._fsm.joined();
    } catch (err) {
      this._fsm.joinFailed();
      throw err;
    }
  }

  /**
   * 重新加入房间
   * @param {String} roomName 房间名称
   */
  async rejoinRoom(roomName) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    const { cid, addr } = await this._lobbyService.joinRoom({
      roomName,
      rejoin: true,
    });
    if (this._fsm.cannot('join')) {
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    this._fsm.join();
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
      await this._gameConn.joinRoom(cid);
      this._fsm.joined();
    } catch (err) {
      this._fsm.joinFailed();
      throw err;
    }
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
    if (this._fsm.cannot('join')) {
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    this._fsm.join();
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
      if (roomCreated) {
        await this._gameConn.createRoom(cid);
      } else {
        await this._gameConn.joinRoom(cid);
      }
      this._fsm.joined();
    } catch (err) {
      this._fsm.joinFailed();
      throw err;
    }
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
    if (this._fsm.cannot('join')) {
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    this._fsm.join();
    try {
      const { cid, addr } = await this._lobbyService.joinRandomRoom(
        matchProperties,
        expectedUserIds
      );
      const { sessionToken } = await this._lobbyService.authorize();
      this._gameConn = new GameConnection();
      await this._gameConn.connect(
        this._appId,
        addr,
        this._gameVersion,
        this._userId,
        sessionToken
      );
      await this._gameConn.joinRoom(cid, matchProperties, expectedUserIds);
      this._fsm.joined();
    } catch (err) {
      this._fsm.joinFailed();
      throw err;
    }
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
    if (typeof piggybackPeerId !== 'string') {
      throw new Error(`${piggybackPeerId} is not a string`);
    }
    if (matchProperties !== null && !(typeof matchProperties === 'object')) {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
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
  async setRoomOpen(open) {
    if (!(typeof open === 'boolean')) {
      throw new TypeError(`${open} is not a boolean value`);
    }
    if (this._room === null) {
      throw new Error('room is null');
    }
    if (!this._fsm.is('game')) {
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    return this._gameConn.setRoomOpen(open).then(
      tap(o => {
        this._room._mergeSystemProps({ open: o });
      })
    );
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
    return this._gameConn.setRoomVisible(visible).then(
      tap(v => {
        this._room._mergeSystemProps({ visible: v });
      })
    );
  }

  /**
   * 设置房间允许的最大玩家数量
   * @param {*} count 数量
   */
  async setRoomMaxPlayerCount(count) {
    if (!(typeof count === 'number') || count < 1) {
      throw new TypeError(`${count} is not a positive number`);
    }
    return this._gameConn.setRoomMaxPlayerCount(count).then(
      tap(c => {
        this._room._mergeSystemProps({ maxPlayerCount: c });
      })
    );
  }

  /**
   * 设置房间占位玩家 Id 列表
   * @param {*} expectedUserIds 玩家 Id 列表
   */
  async setRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.setRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._room._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 清空房间占位玩家 Id 列表
   */
  async clearRoomExpectedUserIds() {
    return this._gameConn.clearRoomExpectedUserIds().then(
      tap(ids => {
        this._room._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 增加房间占位玩家 Id 列表
   * @param {*} expectedUserIds 增加的玩家 Id 列表
   */
  async addRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.addRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._room._mergeSystemProps({ expectedUserIds: ids });
      })
    );
  }

  /**
   * 移除房间占位玩家 Id 列表
   * @param {*} expectedUserIds 移除的玩家 Id 列表
   */
  async removeRoomExpectedUserIds(expectedUserIds) {
    if (!Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array`);
    }
    return this._gameConn.removeRoomExpectedUserIds(expectedUserIds).then(
      tap(ids => {
        this._room._mergeSystemProps({ expectedUserIds: ids });
      })
    );
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
    return this._gameConn.setMaster(newMasterId).then(
      tap(res => {
        const { masterActorId } = res;
        this._room._masterActorId = masterActorId;
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
    // TODO
  }

  /**
   * 踢人
   * @param {Number} actorId 踢用户的 actorId
   * @param {Object} [opts] 附带参数
   * @param {Number} [opts.code] 编码
   * @param {String} [opts.msg] 附带信息
   */
  async kickPlayer(actorId, { code = null, msg = null } = {}) {
    if (!(typeof actorId === 'number')) {
      throw new TypeError(`${actorId} is not a number`);
    }
    if (!(typeof code === 'number')) {
      throw new TypeError(`${code} is not a number`);
    }
    if (!(typeof msg === 'string')) {
      throw new TypeError(`${msg} is not a string`);
    }
    return this._gameConn.kickPlayer(actorId, code, msg).then(
      tap(aId => {
        this._room._removePlayer(aId);
      })
    );
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
    return this._gameConn
      .setRoomCustomProperties(properties, expectedValues)
      .then(
        tap(res => {
          const { attr } = res;
          if (attr) {
            // 如果属性没变化，服务端则不会下发 attr 属性
            this._room._mergeProperties(attr);
          }
        })
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
    return this._gameConn
      .setPlayerCustomProperties(actorId, properties, expectedValues)
      .then(
        tap(res => {
          const { actorId: aId, attr } = res;
          if (aId && attr) {
            const player = this._room.getPlayer(aId);
            player._mergeProperties(attr);
          }
        })
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
