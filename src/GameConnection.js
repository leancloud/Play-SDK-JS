import PlayVersion from './Config';
import Connection, { convertRoomOptions } from './Connection';
import Room from './Room';
import Player from './Player';

const GAME_KEEPALIVE_DURATION = 7000;

// 游戏连接抛出的事件
export const PLAYER_JOINED_EVENT = 'PLAYER_JOINED_EVENT';
export const PLAYER_LEFT_EVENT = 'PLAYER_LEFT_EVENT';
export const MASTER_CHANGED_EVENT = 'MASTER_CHANGED_EVENT';
export const ROOM_OPEN_CHANGED_EVENT = 'ROOM_OPEN_CHANGED_EVENT';
export const ROOM_VISIBLE_CHANGED_EVENT = 'ROOM_VISIBLE_CHANGED_EVENT';
export const ROOM_PROPERTIES_CHANGED_EVENT = 'ROOM_PROPERTIES_CHANGED_EVENT';
export const PLAYER_PROPERTIES_CHANGED_EVENT =
  'PLAYER_PROPERTIES_CHANGED_EVENT';
export const PLAYER_OFFLINE_EVENT = 'PLAYER_OFFLINE_EVENT';
export const PLAYER_ONLINE_EVENT = 'PLAYER_ONLINE_EVENT';
export const SEND_CUSTOM_EVENT = 'SEND_CUSTOM_EVENT';
export const ROOM_KICKED_EVENT = 'ROOM_KICKED_EVENT';

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class GameConnection extends Connection {
  constructor() {
    super();
    this._flag = 'game';
  }

  async openSession(appId, userId, gameVersion) {
    const msg = {
      cmd: 'session',
      op: 'open',
      appId,
      peerId: userId,
      sdkVersion: PlayVersion,
      gameVersion,
    };
    await super.send(msg, undefined, false);
  }

  async createRoom(roomId, roomOptions, expectedUserIds) {
    let msg = {
      cmd: 'conv',
      op: 'start',
    };
    if (roomId) {
      msg.cid = roomId;
    }
    // 拷贝房间属性（包括 系统属性和玩家定义属性）
    if (roomOptions) {
      msg = Object.assign(msg, convertRoomOptions(roomOptions));
    }
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    const res = await super.send(msg, undefined, false);
    return Room._newFromJSONObject(res);
  }

  async joinRoom(roomName, matchProperties, expectedUserIds) {
    const msg = {
      cmd: 'conv',
      op: 'add',
      cid: roomName,
    };
    if (matchProperties) {
      msg.expectAttr = matchProperties;
    }
    if (expectedUserIds) {
      msg.expectMembers = expectedUserIds;
    }
    const res = await super.send(msg, undefined, false);
    return Room._newFromJSONObject(res);
  }

  async leaveRoom() {
    const msg = {
      cmd: 'conv',
      op: 'remove',
    };
    await super.send(msg, undefined, false);
  }

  async setRoomOpened(opened) {
    const msg = {
      cmd: 'conv',
      op: 'open',
      toggle: opened,
    };
    await super.send(msg, undefined, false);
  }

  async setRoomVisible(visible) {
    const msg = {
      cmd: 'conv',
      op: 'visible',
      toggle: visible,
    };
    await super.send(msg, undefined, false);
  }

  async setMaster(newMasterId) {
    const msg = {
      cmd: 'conv',
      op: 'update-master-client',
      masterActorId: newMasterId,
    };
    await super.send(msg, undefined, false);
  }

  async kickPlayer(actorId, code, msg) {
    const req = {
      cmd: 'conv',
      op: 'kick',
      i: this._getMsgId(),
      targetActorId: actorId,
      appCode: code,
      appMsg: msg,
    };
    await super.send(req, undefined, false);
  }

  async sendEvent(eventId, eventData, options) {
    const msg = {
      cmd: 'direct',
      eventId,
      msg: eventData,
      receiverGroup: options.receiverGroup,
      toActorIds: options.targetActorIds,
    };
    await super.send(msg, false);
  }

  async setRoomCustomProperties(properties, expectedValues) {
    const msg = {
      cmd: 'conv',
      op: 'update',
      attr: properties,
    };
    if (expectedValues) {
      msg.expectAttr = expectedValues;
    }
    await super.send(msg, undefined, false);
  }

  async setPlayerCustomProperties(actorId, properties, expectedValues) {
    const msg = {
      cmd: 'conv',
      op: 'update-player-prop',
      targetActorId: actorId,
      attr: properties,
    };
    if (expectedValues) {
      msg.expectAttr = expectedValues;
    }
    await super.send(msg, undefined, false);
  }

  _getPingDuration() {
    return GAME_KEEPALIVE_DURATION;
  }

  _handleMessage(msg) {
    switch (msg.cmd) {
      case 'conv':
        switch (msg.op) {
          case 'members-joined':
            this._handlePlayerJoined(msg);
            break;
          case 'members-left':
            this._handlePlayerLeftMsg(msg);
            break;
          case 'master-client-changed':
            this._handleMasterChangedMsg(msg);
            break;
          case 'opened-notify':
            this._handleRoomOpenChangedMsg(msg);
            break;
          case 'visible-notify':
            this._handleRoomVisibleChangedMsg(msg);
            break;
          case 'updated-notify':
            this._handleRoomPropertiesChangedMsg(msg);
            break;
          case 'player-props':
            this._handlePlayerPropertiesChangedMsg(msg);
            break;
          case 'members-offline':
            this._handlePlayerOfflineMsg(msg);
            break;
          case 'members-online':
            this._handlePlayerOnlineMsg(msg);
            break;
          case 'kicked-notice':
            this._handleKickedMsg(msg);
            break;
          default:
            super._handleUnknownMsg(msg);
            break;
        }
        break;
      case 'events':
        // 目前不作处理
        break;
      case 'direct':
        this._handleSendEventMsg(msg);
        break;
      case 'error':
        super._handleErrorNotify(msg);
        break;
      default:
        super._handleUnknownMsg(msg);
        break;
    }
  }

  _handlePlayerJoined(msg) {
    // TODO 修改 Player 构造方法
    const newPlayer = Player._newFromJSONObject(msg.member);
    this.emit(PLAYER_JOINED_EVENT, newPlayer);
  }

  _handlePlayerLeftMsg(msg) {
    const { initByActor: actorId } = msg;
    this.emit(PLAYER_LEFT_EVENT, actorId);
  }

  _handleMasterChangedMsg(msg) {
    let { masterActorId: newMasterActorId } = msg;
    if (newMasterActorId === null) newMasterActorId = -1;
    this.emit(MASTER_CHANGED_EVENT, newMasterActorId);
  }

  _handleRoomOpenChangedMsg(msg) {
    const { toggle: open } = msg;
    this.emit(ROOM_OPEN_CHANGED_EVENT, open);
  }

  _handleRoomVisibleChangedMsg(msg) {
    const { toggle: visible } = msg;
    this.emit(ROOM_VISIBLE_CHANGED_EVENT, visible);
  }

  _handleRoomPropertiesChangedMsg(msg) {
    const { attr: changedProps } = msg;
    this.emit(ROOM_PROPERTIES_CHANGED_EVENT, changedProps);
  }

  _handlePlayerPropertiesChangedMsg(msg) {
    const { actorId, attr: changedProps } = msg;
    this.emit(PLAYER_PROPERTIES_CHANGED_EVENT, actorId, changedProps);
  }

  _handlePlayerOfflineMsg(msg) {
    const { initByActor: actorId } = msg;
    this.emit(PLAYER_OFFLINE_EVENT, actorId);
  }

  _handlePlayerOnlineMsg(msg) {
    const player = Player._newFromJSONObject(msg.member);
    this.emit(PLAYER_ONLINE_EVENT, player);
  }

  _handleSendEventMsg(msg) {
    const { eventId, msg: eventData, fromActorId: senderId } = msg;
    this.emit(SEND_CUSTOM_EVENT, eventId, eventData, senderId);
  }

  _handleKickedMsg(msg) {
    const { appCode, appMsg } = msg;
    this.emit(ROOM_KICKED_EVENT, appCode, appMsg);
  }
}
