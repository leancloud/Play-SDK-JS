import WebSocket from 'isomorphic-ws';
import axios from 'axios';
import EventEmitter from 'eventemitter3';

import Event from './Event';
import SendEventOptions from './SendEventOptions';
import RoomOptions from './RoomOptions';
import handleMasterMsg from './handler/MasterHandler';
import handleGameMsg from './handler/GameHandler';
import { PlayVersion, MasterServerURL } from './Config';

const debug = require('debug')('Play');

export default class Play extends EventEmitter {
  // 初始化
  init(appId, appKey) {
    if (!(typeof appId === 'string')) {
      throw new TypeError(`${appId} is not a string`);
    }
    if (!(typeof appKey === 'string')) {
      throw new TypeError(`${appKey} is not a string`);
    }
    this._appId = appId;
    this._appKey = appKey;
    this._masterServer = null;
    this._msgId = 0;
    this._requestMsg = {};
    // 切换服务器状态
    this._switchingServer = false;
  }

  // 建立连接
  connect({ gameVersion = '0.0.1', autoJoinLobby = true } = {}) {
    if (gameVersion && !(typeof gameVersion === 'string')) {
      throw new TypeError(`${gameVersion} is not a string`);
    }
    if (autoJoinLobby !== null && !(typeof autoJoinLobby === 'boolean')) {
      throw new TypeError(`${autoJoinLobby} is not a boolean value`);
    }
    this._gameVersion = gameVersion;
    this._autoJoinLobby = autoJoinLobby;
    const params = `appId=${this._appId}&secure=true&ua=${this._getUA()}`;
    axios
      .get(MasterServerURL + params)
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

  // 重连
  reconnect() {
    this._connectToMaster();
  }

  // 重连并重新加入房间
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

  // 断开连接
  disconnect() {
    this._stopKeepAlive();
    if (this._websocket) {
      this._websocket.close();
      this._websocket = null;
    }
    debug(`${this.userId} disconnect.`);
  }

  // 加入大厅
  joinLobby() {
    const msg = {
      cmd: 'lobby',
      op: 'add',
      i: this._getMsgId(),
    };
    this._send(msg);
  }

  // 离开大厅
  leaveLobby() {
    const msg = {
      cmd: 'lobby',
      op: 'remove',
      i: this._getMsgId(),
    };
    this._send(msg);
  }

  // 创建房间
  createRoom(roomName, options = null, expectedUserIds = null) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a String`);
    }
    if (options !== null && !(options instanceof RoomOptions)) {
      throw new TypeError(`${options} is not a RoomOptions`);
    }
    if (expectedUserIds !== null && !Array.isArray(expectedUserIds)) {
      throw new TypeError(`${expectedUserIds} is not an Array with String`);
    }
    // 缓存 GameServer 创建房间的消息体
    this._cachedRoomMsg = {
      cmd: 'conv',
      op: 'start',
      i: this._getMsgId(),
      cid: roomName,
    };
    // 拷贝房间属性（包括 系统属性和玩家定义属性）
    if (options) {
      const opts = options.toMsg();
      this._cachedRoomMsg = Object.assign(this._cachedRoomMsg, opts);
    }
    if (expectedUserIds) {
      this._cachedRoomMsg.expectMembers = expectedUserIds;
    }
    // Router 创建房间的消息体
    const msg = this._cachedRoomMsg;
    this._send(msg);
  }

  // 指定房间名加入房间
  // 可选：期望好友 IDs
  joinRoom(roomName, expectedUserIds = null) {
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

  // 重新加入房间
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

  // 随机加入或创建房间
  joinOrCreateRoom(roomName, options = null, expectedUserIds = null) {
    if (!(typeof roomName === 'string')) {
      throw new TypeError(`${roomName} is not a string`);
    }
    if (options !== null && !(options instanceof RoomOptions)) {
      throw new TypeError(`${options} is not a RoomOptions`);
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
    if (options != null) {
      const opts = options.toMsg();
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

  // 随机加入房间
  joinRandomRoom(matchProperties = null, expectedUserIds = null) {
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

  // 设置房间开启 / 关闭
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

  // 设置房间可见 / 不可见
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

  // 离开房间
  leaveRoom() {
    const msg = {
      cmd: 'conv',
      op: 'remove',
      i: this._getMsgId(),
      cid: this.room.name,
    };
    this._send(msg);
  }

  // 设置房主
  setMaster(nextMasterActorId) {
    if (!(typeof nextMasterActorId === 'number')) {
      throw new TypeError(`${nextMasterActorId} is not a number`);
    }
    const msg = {
      cmd: 'conv',
      op: 'update-master-client',
      i: this._getMsgId(),
      masterActorId: nextMasterActorId,
    };
    this._send(msg);
  }

  // 设置房间属性
  setRoomCustomProperties(properties, expectedValues = null) {
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
  setPlayerCustomProperties(actorId, properties, expectedValues = null) {
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

  // 发送自定义消息
  sendEvent(eventId, eventData, options = new SendEventOptions()) {
    if (!(typeof eventId === 'string') && !(typeof eventId === 'number')) {
      throw new TypeError(`${eventId} is not a string or number`);
    }
    if (!(typeof eventData === 'object')) {
      throw new TypeError(`${eventData} is not an object`);
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

  // Getter
  get room() {
    return this._room;
  }

  get player() {
    return this._player;
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
