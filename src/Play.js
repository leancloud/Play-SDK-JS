import WebSocket from 'isomorphic-ws';
import axios from 'axios';
import EventEmitter from 'eventemitter3';

import Region from './Region';
import Event from './Event';
import SendEventOptions from './SendEventOptions';
import RoomOptions from './RoomOptions';
import handleMasterMsg from './handler/MasterHandler';
import handleGameMsg from './handler/GameHandler';
import {
  PlayVersion,
  NorthCNServerURL,
  EastCNServerURL,
  USServerURL,
} from './Config';

const debug = require('debug')('Play');

/**
 * Play 客户端类
 */
export default class Play extends EventEmitter {
  constructor() {
    super();
    /**
     * 玩家 ID
     * @type {string}
     */
    this.userId = null;
    this._room = null;
    this._player = null;
  }

  /**
   * 初始化客户端
   * @param {PlayOptions} opts
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
    this._appId = opts.appId;
    this._appKey = opts.appKey;
    this._region = opts.region;
    this._masterServer = null;
    this._msgId = 0;
    this._requestMsg = {};
    // 切换服务器状态
    this._switchingServer = false;
  }

  /**
   * 建立连接
   * @param {Object} opts （可选）连接选项
   * @param {string} opts.gameVersion （可选）游戏版本号，不同的游戏版本号将路由到不同的服务端，默认值为 0.0.1
   * @param {boolean} opts.autoJoinLobby （可选）是否自动加入大厅，默认值为 true
   */
  connect({ gameVersion = '0.0.1', autoJoinLobby = true } = {}) {
    if (gameVersion && !(typeof gameVersion === 'string')) {
      throw new TypeError(`${gameVersion} is not a string`);
    }
    if (autoJoinLobby !== null && !(typeof autoJoinLobby === 'boolean')) {
      throw new TypeError(`${autoJoinLobby} is not a boolean value`);
    }
    this._gameVersion = gameVersion;
    this._autoJoinLobby = autoJoinLobby;
    let masterURL = EastCNServerURL;
    if (this._region === Region.NORTH_CN) {
      masterURL = NorthCNServerURL;
    } else if (this._region === Region.EAST_CN) {
      masterURL = EastCNServerURL;
    } else if (this._region === Region.US) {
      masterURL = USServerURL;
    }
    const params = `appId=${this._appId}&secure=true&ua=${this._getUA()}`;
    const url = `${masterURL}v1/router?${params}`;
    axios
      .get(url)
      .then(response => {
        debug(response.data);
        this._masterServer = response.data.server;
        this._connectToMaster();
      })
      .catch(error => {
        console.error(error);
        this.emit(Event.CONNECT_FAILED, error.data);
      });
  }

  /**
   * 重新连接
   */
  reconnect() {
    this._connectToMaster();
  }

  /**
   * 重新连接并自动加入房间
   */
  reconnectAndRejoin() {
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
    this._stopKeepAlive();
    if (this._websocket) {
      this._websocket.close();
      this._websocket = null;
    }
    debug(`${this.userId} disconnect.`);
  }

  /**
   * 加入大厅，只有在 autoJoinLobby = false 时才需要调用
   */
  joinLobby() {
    const msg = {
      cmd: 'lobby',
      op: 'add',
      i: this._getMsgId(),
    };
    this._send(msg);
  }

  /**
   * 离开大厅
   */
  leaveLobby() {
    const msg = {
      cmd: 'lobby',
      op: 'remove',
      i: this._getMsgId(),
    };
    this._send(msg);
  }

  /**
   * 创建房间
   * @param {string} roomName 房间名称，在整个游戏中保证唯一
   * @param {Object} opts （可选）创建房间选项
   * @param {RoomOptions} opts.roomOptions （可选）创建房间选项，默认值为 null
   * @param {Array.<string>} opts.expectedUserIds （可选）邀请好友 ID 数组，默认值为 null
   */
  createRoom(roomName, { roomOptions = null, expectedUserIds = null } = {}) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }

    if (roomOptions !== null && !(roomOptions instanceof RoomOptions)) {
      throw new TypeError(`${roomOptions} is not a RoomOptions`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an Array with string`);
    }
    // 缓存 GameServer 创建房间的消息体
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'start',
      i: this._getMsgId(),
      cid: roomName,
    };
    // 拷贝房间属性（包括 系统属性和玩家定义属性）
    if (roomOptions) {
      const opts = roomOptions._toMsg();
      this._cachedRoomMsg = Object.assign(this._cachedRoomMsg, opts);
    }
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }
    // Router 创建房间的消息体
    const msg = this._cachedRoomMsg;
    this._send(msg);
  }

  /**
   * 加入房间
   * @param {string} roomName 房间名称
   * @param {*} expectedUserIds （可选）邀请好友 ID 数组，默认值为 null
   */
  joinRoom(roomName, { expectedUserIds = null } = {}) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
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
    this._send(msg);
  }

  /**
   * 重新加入房间
   * @param {string} roomName 房间名称
   */
  rejoinRoom(roomName) {
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'add',
      i: this._getMsgId(),
      cid: roomName,
      rejoin: true,
    };
    const msg = this._cachedRoomMsg;
    this._send(msg);
  }

  /**
   * 随机加入或创建房间
   * @param {string} roomName 房间名称
   * @param {Object} opts （可选）创建房间选项
   * @param {RoomOptions} opts.roomOptions （可选）创建房间选项，默认值为 null
   * @param {Array.<string>} opts.expectedUserIds （可选）邀请好友 ID 数组，默认值为 null
   */
  joinOrCreateRoom(
    roomName,
    { roomOptions = null, expectedUserIds = null } = {}
  ) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (roomOptions !== null && !(roomOptions instanceof RoomOptions)) {
      throw new TypeError(`${roomOptions} is not a RoomOptions`);
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
      const opts = roomOptions._toMsg();
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
    this._send(msg);
  }

  /**
   * 随机加入房间
   * @param {Object} opts （可选）随机加入房间选项
   * @param {Object} opts.matchProperties （可选）匹配属性，默认值为 null
   * @param {Array.<string>} opts.expectedUserIds （可选）邀请好友 ID 数组，默认值为 null
   */
  joinRandomRoom({ matchProperties = null, expectedUserIds = null } = {}) {
    if (matchProperties !== null && !(typeof matchProperties === 'object')) {
      throw new TypeError(`${matchProperties} is not an object`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an array with string`);
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
    this._send(msg);
  }

  /**
   * 设置房间开启 / 关闭
   * @param {Boolean} opened 是否开启
   */
  setRoomOpened(opened) {
    if (!(typeof opened === 'boolean')) {
      throw new TypeError(`${opened} is not a boolean value`);
    }
    const msg = {
      cmd: 'conv',
      op: 'open',
      i: this._getMsgId(),
      toggle: opened,
    };
    this.this._send(msg);
  }

  /**
   * 设置房间可见 / 不可见
   * @param {Boolean} visible 是否可见
   */
  setRoomVisible(visible) {
    if (!(typeof visible === 'boolean')) {
      throw new TypeError(`${visible} is not a boolean value`);
    }
    const msg = {
      cmd: 'conv',
      op: 'visible',
      i: this._getMsgId(),
      toggle: visible,
    };
    this._send(msg);
  }

  /**
   * 设置房主
   * @param {number} newMasterId 新房主 ID
   */
  setMaster(newMasterId) {
    if (!(typeof newMasterId === 'number')) {
      throw new TypeError(`${newMasterId} is not a number`);
    }
    const msg = {
      cmd: 'conv',
      op: 'update-master-client',
      i: this._getMsgId(),
      masterActorId: newMasterId,
    };
    this._send(msg);
  }

  /**
   * 发送自定义消息
   * @param {number|string} eventId 事件 ID
   * @param {Object} eventData 事件参数
   * @param {SendEventOptions} options 发送事件选项
   */
  sendEvent(eventId, eventData, options) {
    if (!(typeof eventId === 'string') && !(typeof eventId === 'number')) {
      throw new TypeError(`${eventId} is not a string or number`);
    }
    if (!(typeof eventData === 'object')) {
      throw new TypeError(`${eventData} is not an object`);
    }
    if (!(options instanceof SendEventOptions)) {
      throw new TypeError(`${options} is not a SendEventOptions`);
    }
    const msg = {
      cmd: 'direct',
      i: this._getMsgId(),
      eventId,
      msg: eventData,
      receiverGroup: options.receiverGroup,
      toActorIds: options.targetActorIds,
      cachingOption: options.cachingOption,
    };
    this._send(msg);
  }

  /**
   * 离开房间
   */
  leaveRoom() {
    const msg = {
      cmd: 'conv',
      op: 'remove',
      i: this._getMsgId(),
      cid: this.room.name,
    };
    this._send(msg);
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

  // 设置房间属性
  _setRoomCustomProperties(properties, expectedValues) {
    if (!(typeof properties === 'object')) {
      throw new TypeError(`${properties} is not an object`);
    }
    if (expectedValues && !(typeof expectedValues === 'object')) {
      throw new TypeError(`${expectedValues} is not an object`);
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
    this._send(msg);
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
    const msg = {
      cmd: 'conv',
      op: 'update-player-prop',
      i: this._getMsgId(),
      targetActorId: actorId,
      playerProperty: properties,
    };
    if (expectedValues) {
      msg.expectAttr = expectedValues;
    }
    this._send(msg);
  }

  // 开始会话，建立连接后第一条消息
  _sessionOpen() {
    const msg = {
      cmd: 'session',
      op: 'open',
      i: this._getMsgId(),
      appId: this._appId,
      peerId: this.userId,
      ua: this._getUA(),
    };
    this._send(msg);
  }

  // 发送消息
  _send(msg) {
    if (!(typeof msg === 'object')) {
      throw new TypeError(`${msg} is not an object`);
    }
    const msgData = JSON.stringify(msg);
    debug(`${this.userId} msg: ${msg.op} -> ${msgData}`);
    this._websocket.send(msgData);
    // 心跳包
    this._stopKeepAlive();
    this._keepAlive = setTimeout(() => {
      const keepAliveMsg = {};
      this._send(keepAliveMsg);
    }, 10000);
  }

  // 连接至大厅服务器
  _connectToMaster() {
    this._cleanup();
    this._switchingServer = true;
    this._websocket = new WebSocket(this._masterServer);
    this._websocket.onopen = () => {
      debug('Lobby websocket opened');
      this._switchingServer = false;
      this._sessionOpen();
    };
    this._websocket.onmessage = msg => {
      handleMasterMsg(this, msg);
    };
    this._websocket.onclose = () => {
      debug('Lobby websocket closed');
      if (!this._switchingServer) {
        this.emit(Event.DISCONNECTED);
      }
    };
    this._websocket.onerror = error => {
      console.error(error);
      this.emit(Event.CONNECT_FAILED, error.data);
    };
  }

  // 连接至游戏服务器
  _connectToGame() {
    this._cleanup();
    this._switchingServer = true;
    this._websocket = new WebSocket(this._secureGameAddr);
    this._websocket.onopen = () => {
      debug('Game websocket opened');
      this._switchingServer = false;
      this._sessionOpen();
    };
    this._websocket.onmessage = msg => {
      handleGameMsg(this, msg);
    };
    this._websocket.onclose = () => {
      debug('Game websocket closed');
      if (!this._switchingServer) {
        this.emit(Event.DISCONNECTED);
      }
      this._stopKeepAlive();
    };
    this._websocket.onerror = error => {
      console.error(error);
      this.emit(Event.CONNECT_FAILED, error.data);
    };
  }

  _getMsgId() {
    this._msgId += 1;
    return this._msgId;
  }

  _stopKeepAlive() {
    if (this._keepAlive) {
      clearTimeout(this._keepAlive);
      this._keepAlive = null;
    }
  }

  _cleanup() {
    if (this._websocket) {
      this._websocket.onopen = null;
      this._websocket.onconnect = null;
      this._websocket.onmessage = null;
      this._websocket.onclose = null;
      this._websocket.close();
      this._websocket = null;
    }
  }

  _getUA() {
    return `${PlayVersion}_${this._gameVersion}`;
  }
}
