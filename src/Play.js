import request from 'superagent';
import EventEmitter from 'eventemitter3';

import Region from './Region';
import Event from './Event';
import handleLobbyMsg from './handler/LobbyHandler';
import handleGameMsg from './handler/GameHandler';
import {
  PlayVersion,
  NorthCNServerURL,
  EastCNServerURL,
  USServerURL,
} from './Config';
import { adapters } from './PlayAdapter';
import isWeapp from './Utils';
import PlayState from './PlayState';
import { debug, warn, error } from './Logger';

const MAX_PLAYER_COUNT = 10;
const LOBBY_KEEPALIVE_DURATION = 120000;
const GAME_KEEPALIVE_DURATION = 10000;
const MAX_NO_PONG_TIMES = 3;

function convertRoomOptions(roomOptions) {
  const options = {};
  if (!roomOptions.opened) options.open = roomOptions.opened;
  if (!roomOptions.visible) options.visible = roomOptions.visible;
  if (roomOptions.emptyRoomTtl > 0)
    options.emptyRoomTtl = roomOptions.emptyRoomTtl;
  if (roomOptions.playerTtl > 0) options.playerTtl = roomOptions.playerTtl;
  if (
    roomOptions.maxPlayerCount > 0 &&
    roomOptions.maxPlayerCount < MAX_PLAYER_COUNT
  )
    options.maxMembers = roomOptions.maxPlayerCount;
  if (roomOptions.customRoomProperties)
    options.attr = roomOptions.customRoomProperties;
  if (roomOptions.customRoomPropertyKeysForLobby)
    options.lobbyAttrKeys = roomOptions.customRoomPropertyKeysForLobby;
  if (roomOptions.flag) options.flag = roomOptions.flag;
  return options;
}

function _closeSocket(websocket) {
  const ws = websocket;
  if (ws) {
    ws.onopen = null;
    ws.onconnect = null;
    ws.onmessage = null;
    ws.onclose = null;
    try {
      ws.close();
    } catch (e) {
      debug(`close socket exception: ${e}`);
    }
  }
}

/**
 * Play 客户端类
 */
export default class Play extends EventEmitter {
  /**
   * 初始化客户端
   * @param {Object} opts
   * @param {string} opts.appId APP ID
   * @param {string} opts.appKey APP KEY
   * @param {number} opts.region 节点地区
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
    this._appId = opts.appId;
    this._appKey = opts.appKey;
    this._region = opts.region;
    this._feature = opts.feature;
    /**
     * 玩家 ID
     * @type {string}
     */
    this.userId = null;
    this.reset();
  }

  /**
   * 建立连接
   * @param {Object} [opts] 连接选项
   * @param {string} [opts.gameVersion] 游戏版本号，不同的游戏版本号将路由到不同的服务端，默认值为 0.0.1
   */
  connect({ gameVersion = '0.0.1' } = {}) {
    // 判断是否有 userId
    if (this.userId === null) {
      throw new Error('userId is null');
    }
    // 判断是否是「断开」状态
    if (this._playState !== PlayState.CLOSED) {
      throw new Error(`play state error: ${this._playState}`);
    }
    // 判断是否已经在等待连接
    if (this._connectTimer) {
      warn('waiting for connect');
      return;
    }

    // 判断连接时间
    const now = new Date().getTime();
    if (now < this._nextConnectTimestamp) {
      const waitTime = this._nextConnectTimestamp - now;
      debug(`wait time: ${waitTime}`);
      this._connectTimer = setTimeout(() => {
        debug('connect time out');
        this._connect(gameVersion);
        clearTimeout(this._connectTimer);
        this._connectTimer = null;
      }, waitTime);
    } else {
      this._connect(gameVersion);
    }
  }

  _connect(gameVersion) {
    if (gameVersion && !(typeof gameVersion === 'string')) {
      throw new TypeError(`${gameVersion} is not a string`);
    }
    this._gameVersion = gameVersion;
    let masterURL = EastCNServerURL;
    if (this._region === Region.NorthChina) {
      masterURL = NorthCNServerURL;
    } else if (this._region === Region.EastChina) {
      masterURL = EastCNServerURL;
    } else if (this._region === Region.NorthAmerica) {
      masterURL = USServerURL;
    }

    this._playState = PlayState.CONNECTING;
    const query = { appId: this._appId, sdkVersion: PlayVersion };
    // 使用设置覆盖 SDK 判断的 feature
    if (this._feature) {
      query.feature = this._feature;
    } else if (isWeapp) {
      query.feature = 'wechat';
    }
    this._httpReq = request
      .get(masterURL)
      .query(query)
      .end((err, response) => {
        if (err) {
          error(err);
          // 连接失败，则增加下次连接时间间隔
          this._connectFailedCount += 1;
          this._nextConnectTimestamp =
            Date.now() + 2 ** this._connectFailedCount * 1000;
          this.emit(Event.CONNECT_FAILED, {
            code: -1,
            detail: 'Game router connect failed',
          });
        } else {
          const body = JSON.parse(response.text);
          debug(response.text);
          // 重置下次允许的连接时间
          this._connectFailedCount = 0;
          this._nextConnectTimestamp = 0;
          clearTimeout(this._connectTimer);
          this._connectTimer = null;
          // 主大厅服务器
          this._primaryServer = body.server;
          // 备用大厅服务器
          this._secondaryServer = body.secondary;
          // 默认服务器是 master server
          this._masterServer = this._primaryServer;
          // ttl
          this._serverValidTimeStamp = Date.now() + body.ttl * 1000;
          this._connectToMaster();
        }
      });
  }

  /**
   * 重新连接
   */
  reconnect() {
    const now = Date.now();
    if (now > this._serverValidTimeStamp) {
      // 超出 ttl 后将重新请求 router 连接
      this.connect(this._gameVersion);
    } else {
      this._connectToMaster();
    }
  }

  /**
   * 重新连接并自动加入房间
   */
  reconnectAndRejoin() {
    if (this._cachedRoomMsg === null) {
      throw new Error('no cache room info');
    }
    if (this._cachedRoomMsg.cid === undefined) {
      throw new Error('not cache room name');
    }
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: this._cachedRoomMsg.cid,
      rejoin: true,
    };
    this._connectToGame();
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (
      this._playState !== PlayState.LOBBY_OPEN &&
      this._playState !== PlayState.GAME_OPEN
    ) {
      throw new Error(`error play state: ${this._playState}`);
    }
    this._playState = PlayState.CLOSING;
    this._stopPing();
    this._stopPong();
    this._closeLobbySocket();
    this._closeGameSocket();
    this._playState = PlayState.CLOSED;
    this.emit(Event.DISCONNECTED);
    debug(`${this.userId} disconnect.`);
  }

  /**
   * 重置
   */
  reset() {
    this._room = null;
    this._player = null;
    this._cachedRoomMsg = null;
    this._playState = PlayState.CLOSED;
    this._masterServer = null;
    this._gameServer = null;
    this._msgId = 0;
    this._inLobby = false;
    this._lobbyRoomList = null;
    this._connectFailedCount = 0;
    this._nextConnectTimestamp = 0;
    this._gameToLobby = false;
    this._stopConnectTimer();
    this._cancelHttp();
    this._stopPing();
    this._stopPong();
    this._closeLobbySocket();
    this._closeGameSocket();
    // this._closeSocket();
  }

  /**
   * 加入大厅，只有在 autoJoinLobby = false 时才需要调用
   */
  joinLobby() {
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'lobby',
      op: 'add',
      i: this._getMsgId(),
    };
    this._sendLobbyMessage(msg);
  }

  /**
   * 离开大厅
   */
  leaveLobby() {
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'lobby',
      op: 'remove',
      i: this._getMsgId(),
    };
    this._sendLobbyMessage(msg);
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
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    // 缓存 GameServer 创建房间的消息体
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'start',
      i: this._getMsgId(),
    };
    if (roomName) {
      this._cachedRoomMsg.cid = roomName;
    }
    // 拷贝房间属性（包括 系统属性和玩家定义属性）
    if (roomOptions) {
      const opts = convertRoomOptions(roomOptions);
      this._cachedRoomMsg = Object.assign(this._cachedRoomMsg, opts);
    }
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }
    // Router 创建房间的消息体
    const msg = this._cachedRoomMsg;
    this._sendLobbyMessage(msg);
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
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    // 加入房间的消息体
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
    };
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }
    const msg = this._cachedRoomMsg;
    this._sendLobbyMessage(msg);
  }

  /**
   * 重新加入房间
   * @param {string} roomName 房间名称
   */
  rejoinRoom(roomName) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
      rejoin: true,
    };
    const msg = this._cachedRoomMsg;
    this._sendLobbyMessage(msg);
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
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    if (roomOptions !== null && !(roomOptions instanceof Object)) {
      throw new TypeError(`${roomOptions} is not a Object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
    }
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
    };
    // 拷贝房间参数
    if (roomOptions != null) {
      const opts = convertRoomOptions(roomOptions);
      this._cachedRoomMsg = Object.assign(this._cachedRoomMsg, opts);
    }
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }
    const msg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
      createOnNotFound: true,
    };
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    this._sendLobbyMessage(msg);
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
    if (this._playState !== PlayState.LOBBY_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
    };
    if (matchProperties) {
      this._cachedRoomMsg.expectAttr = matchProperties;
    }
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }

    const msg = {
      cmd: 'conv',
      op: 'add-random',
    };
    if (matchProperties) {
      msg.expectAttr = matchProperties;
    }
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    this._sendLobbyMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'open',
      i: this._getMsgId(),
      toggle: opened,
    };
    this._sendGameMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'visible',
      i: this._getMsgId(),
      toggle: visible,
    };
    this._sendGameMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'update-master-client',
      i: this._getMsgId(),
      masterActorId: newMasterId,
    };
    this._sendGameMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'direct',
      i: this._getMsgId(),
      eventId,
      msg: eventData,
      receiverGroup: options.receiverGroup,
      toActorIds: options.targetActorIds,
    };
    this._sendGameMessage(msg);
  }

  /**
   * 离开房间
   */
  leaveRoom() {
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'remove',
      i: this._getMsgId(),
      cid: this.room.name,
    };
    this._sendGameMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'update',
      i: this._getMsgId(),
      attr: properties,
    };
    if (expectedValues) {
      msg.expectAttr = expectedValues;
    }
    this._sendGameMessage(msg);
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
    if (this._playState !== PlayState.GAME_OPEN) {
      throw new Error(`error play state: ${this._playState}`);
    }
    const msg = {
      cmd: 'conv',
      op: 'update-player-prop',
      i: this._getMsgId(),
      targetActorId: actorId,
      attr: properties,
    };
    if (expectedValues) {
      msg.expectAttr = expectedValues;
    }
    this._sendGameMessage(msg);
  }

  // 开始大厅会话
  _lobbySessionOpen() {
    const msg = {
      cmd: 'session',
      op: 'open',
      i: this._getMsgId(),
      appId: this._appId,
      peerId: this.userId,
      sdkVersion: PlayVersion,
      gameVersion: this._gameVersion,
    };
    this._sendLobbyMessage(msg);
  }

  // 开始房间会话
  _gameSessionOpen() {
    const msg = {
      cmd: 'session',
      op: 'open',
      i: this._getMsgId(),
      appId: this._appId,
      peerId: this.userId,
      sdkVersion: PlayVersion,
      gameVersion: this._gameVersion,
    };
    this._sendGameMessage(msg);
  }

  // 发送大厅消息
  _sendLobbyMessage(msg) {
    const msgData = JSON.stringify(msg);
    debug(`${this.userId} Lobby msg: ${msg.op} -> ${msgData}`);
    this._send(this._lobbyWS, msg, LOBBY_KEEPALIVE_DURATION);
  }

  // 发送房间消息
  _sendGameMessage(msg) {
    const msgData = JSON.stringify(msg);
    debug(`${this.userId} Game  msg: ${msg.op} -> ${msgData}`);
    this._send(this._gameWS, msg, GAME_KEEPALIVE_DURATION);
  }

  // 发送消息
  _send(ws, msg, duration) {
    if (!(typeof msg === 'object')) {
      throw new TypeError(`${msg} is not an object`);
    }
    const msgData = JSON.stringify(msg);
    ws.send(msgData);
    // 心跳包
    this._stopPing();
    this._ping = setTimeout(() => {
      debug('ping time out');
      const ping = {};
      this._send(ws, ping, duration);
    }, duration);
  }

  // 连接至大厅服务器
  _connectToMaster(gameToLobby = false) {
    this._playState = PlayState.CONNECTING;
    this._gameToLobby = gameToLobby;
    const { WebSocket } = adapters;
    this._lobbyWS = new WebSocket(this._masterServer);
    this._lobbyWS.onopen = () => {
      debug('Lobby websocket opened');
      this._lobbySessionOpen();
    };
    this._lobbyWS.onmessage = msg => {
      this._stopPong();
      this._startPongListener(this._lobbyWS, LOBBY_KEEPALIVE_DURATION);
      handleLobbyMsg(this, msg);
    };
    this._lobbyWS.onclose = evt => {
      this._playState = PlayState.CLOSED;
      debug(`Lobby websocket closed: ${evt.code}`);
      if (evt.code === 1006) {
        // 连接失败
        if (this._masterServer === this._secondaryServer) {
          this.emit(Event.CONNECT_FAILED, {
            code: -2,
            detail: 'Lobby socket connect failed',
          });
        } else {
          // 内部重连
          this._masterServer = this._secondaryServer;
          this._connectToMaster();
        }
      } else {
        // 断开连接
        this.emit(Event.DISCONNECTED);
      }
      this._stopPing();
      this._stopPong();
    };
    this._lobbyWS.onerror = err => {
      error(err);
    };
  }

  // 连接至游戏服务器
  _connectToGame() {
    this._playState = PlayState.CONNECTING;
    const { WebSocket } = adapters;
    this._gameWS = new WebSocket(this._gameServer);
    this._gameWS.onopen = () => {
      debug('Game websocket opened');
      this._gameSessionOpen();
    };
    this._gameWS.onmessage = msg => {
      this._stopPong();
      this._startPongListener(this._gameWS, GAME_KEEPALIVE_DURATION);
      handleGameMsg(this, msg);
    };
    this._gameWS.onclose = evt => {
      this._playState = PlayState.CLOSED;
      debug('Game websocket closed');
      if (evt.code === 1006) {
        // 连接失败
        this.emit(Event.CONNECT_FAILED, {
          code: -2,
          detail: 'Game socket connect failed',
        });
      } else {
        // 断开连接
        this.emit(Event.DISCONNECTED);
      }
      this._stopPing();
      this._stopPong();
    };
    this._gameWS.onerror = err => {
      error(err);
    };
  }

  _getMsgId() {
    this._msgId += 1;
    return this._msgId;
  }

  _stopConnectTimer() {
    if (this._connectTimer) {
      clearTimeout(this._connectTimer);
      this._connectTimer = null;
    }
  }

  _stopPing() {
    if (this._ping) {
      clearTimeout(this._ping);
      this._ping = null;
    }
  }

  _stopPong() {
    if (this._pong) {
      debug('stop pong');
      clearTimeout(this._pong);
      this._pong = null;
    }
  }

  _startPongListener(ws, duration) {
    debug('start pong');
    this._pong = setTimeout(() => {
      debug('pong time out');
      ws.close();
    }, duration * MAX_NO_PONG_TIMES);
  }

  _cancelHttp() {
    if (this._httpReq) {
      this._httpReq.abort();
    }
  }

  _closeLobbySocket() {
    _closeSocket(this._lobbyWS);
  }

  _closeGameSocket() {
    _closeSocket(this._gameWS);
  }
}
