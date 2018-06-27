import WebSocket from 'isomorphic-ws';
import axios from 'axios';
import EventEmitter from 'eventemitter3';

import Event from './Event';
import SendEventOptions from './SendEventOptions';
import RoomOptions from './RoomOptions';
import handleMasterMsg from './handler/MasterHandler';
import handleGameMsg from './handler/GameHandler';
import { PlayVersion, MasterServerURL } from './Config';

let instance = null;
export default class Play extends EventEmitter {
  static getInstance() {
    return instance;
  }

  // 初始化
  init(appId, appKey) {
    this._appId = appId;
    this._appKey = appKey;
    this._masterServer = null;
    this._msgId = 0;
    this._requestMsg = {};
    // 切换服务器状态
    this._switchingServer = false;
  }

  // 建立连接
  connect(gameVersion = '0.0.1', autoJoinLobby = true) {
    this._gameVersion = gameVersion;
    this._autoJoinLobby = autoJoinLobby;
    const self = this;
    const params = `appId=${this._appId}&secure=true&ua=${this._getUA()}`;
    axios
      .get(MasterServerURL + params)
      .then(response => {
        console.warn(response.data);
        self._masterServer = response.data.server;
        self._connectToMaster();
      })
      .catch(error => {
        console.warn(error);
        self.emit(Event.OnConnectFailed, error.data);
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
    console.warn(`${this.userId} disconnect.`);
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
    if (options !== null && !(options instanceof RoomOptions)) {
      console.error('options must be RoomOptions');
      return;
    }
    if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
      console.error('expectedUserIds must be Array with string');
      return;
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
    if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
      console.error('expectedUserIds must be Array with string');
      return;
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
    if (options !== null && !(options instanceof RoomOptions)) {
      console.error('options must be RoomOptions');
      return;
    }
    if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
      console.error('expectedUserIds must be Array with string');
      return;
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
    if (matchProperties !== null && !(matchProperties instanceof Object)) {
      console.error('match properties must be Object');
      return;
    }
    if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
      console.error('expectedUserIds must be Array with string');
      return;
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
    if (!(properties instanceof Object)) {
      console.error('property must be Object');
      return;
    }
    if (expectedValues && !(expectedValues instanceof Object)) {
      console.error('expectedValue must be Object');
      return;
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
    if (!(properties instanceof Object)) {
      console.error('property must be Object');
      return;
    }
    if (expectedValues && !(expectedValues instanceof Object)) {
      console.error('expectedValue must be Object');
      return;
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
    if (!(eventData instanceof Object)) {
      console.error('event data must be Object');
      return;
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
    const msgData = JSON.stringify(msg);
    console.warn(`${this.userId} msg: ${msg.op} -> ${msgData}`);
    this._websocket.send(msgData);
    // 心跳包
    this._stopKeepAlive();
    const self = this;
    this._keepAlive = setTimeout(() => {
      const keepAliveMsg = {};
      self._send(keepAliveMsg);
    }, 10000);
  }

  // 连接至大厅服务器
  _connectToMaster() {
    this._cleanup();
    this._switchingServer = true;
    const self = this;
    this._websocket = new WebSocket(this._masterServer);
    this._websocket.onopen = () => {
      console.warn('Lobby websocket opened');
      self._switchingServer = false;
      self._sessionOpen();
    };
    this._websocket.onmessage = msg => {
      handleMasterMsg(self, msg);
    };
    this._websocket.onclose = () => {
      console.warn('Lobby websocket closed');
      if (!self._switchingServer) {
        self.emit(Event.OnDisconnected);
      }
    };
    this._websocket.onerror = error => {
      console.error(error);
      self.emit(Event.OnConnectFailed, error.data);
    };
  }

  // 连接至游戏服务器
  _connectToGame() {
    this._cleanup();
    this._switchingServer = true;
    const self = this;
    this._websocket = new WebSocket(this._secureGameAddr);
    this._websocket.onopen = () => {
      console.warn('Game websocket opened');
      self._switchingServer = false;
      self._sessionOpen();
    };
    this._websocket.onmessage = msg => {
      handleGameMsg(self, msg);
    };
    this._websocket.onclose = () => {
      console.warn('Game websocket closed');
      if (!self._switchingServer) {
        self.emit(Event.OnDisconnected);
      }
      self._stopKeepAlive();
    };
    this._websocket.onerror = error => {
      console.error(error);
      self.emit(Event.OnConnectFailed, error.data);
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

instance = new Play();
