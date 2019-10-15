import Connection, { convertToRoomOptions } from './Connection';
import Room from './Room';
import Player from './Player';
import ReceiverGroup from './ReceiverGroup';
import { deserializeObject, serializeObject } from './CodecUtils';
import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { sdkVersion, protocolVersion } from './Config';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';

// eslint-disable-next-line camelcase
const google_protobuf_wrappers_pb = require('google-protobuf/google/protobuf/wrappers_pb.js');
// eslint-disable-next-line camelcase
const { BoolValue } = google_protobuf_wrappers_pb;

const GAME_KEEPALIVE_DURATION = 7000;

const messages = require('./proto/messages_pb');

const {
  CommandType,
  OpType,
  RequestMessage,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomOptions,
  UpdateSysPropertyRequest,
  RoomSystemProperty,
  UpdateMasterClientRequest,
  KickMemberRequest,
  AppInfo,
  DirectCommand,
  Body,
  UpdatePropertyRequest,
} = messages;

// 游戏连接抛出的事件
export const PLAYER_JOINED_EVENT = 'PLAYER_JOINED_EVENT';
export const PLAYER_LEFT_EVENT = 'PLAYER_LEFT_EVENT';
export const MASTER_CHANGED_EVENT = 'MASTER_CHANGED_EVENT';
export const ROOM_OPEN_CHANGED_EVENT = 'ROOM_OPEN_CHANGED_EVENT';
export const ROOM_VISIBLE_CHANGED_EVENT = 'ROOM_VISIBLE_CHANGED_EVENT';
export const ROOM_PROPERTIES_CHANGED_EVENT = 'ROOM_PROPERTIES_CHANGED_EVENT';
export const ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT =
  'ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT';
export const PLAYER_PROPERTIES_CHANGED_EVENT =
  'PLAYER_PROPERTIES_CHANGED_EVENT';
export const PLAYER_OFFLINE_EVENT = 'PLAYER_OFFLINE_EVENT';
export const PLAYER_ONLINE_EVENT = 'PLAYER_ONLINE_EVENT';
export const SEND_CUSTOM_EVENT = 'SEND_CUSTOM_EVENT';
export const ROOM_KICKED_EVENT = 'ROOM_KICKED_EVENT';

function convertToPlayer(member) {
  const player = new Player();
  player._userId = member.getPid();
  player._actorId = member.getActorId();
  player._active = !member.getInactive();
  player._properties = deserializeObject(member.getAttr());
  return player;
}

function convertToRoom(roomOptions) {
  const room = new Room();
  room._name = roomOptions.getCid();
  room._open = roomOptions.getOpen().getValue();
  room._visible = roomOptions.getVisible().getValue();
  room._maxPlayerCount = roomOptions.getMaxMembers();
  room._masterActorId = roomOptions.getMasterActorId();
  room._expectedUserIds = roomOptions.getExpectMembersList();
  room._players = {};
  roomOptions.getMembersList().forEach(member => {
    const player = convertToPlayer(member);
    room._players[player.actorId] = player;
  });
  // 属性
  if (roomOptions.getAttr()) {
    room._properties = deserializeObject(roomOptions.getAttr());
  } else {
    room._properties = {};
  }
  return room;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class GameConnection extends Connection {
  constructor() {
    super();
    this._flag = 'game';
  }

  connect(appId, server, gameVersion, userId, sessionToken) {
    this._userId = userId;
    return new Promise((resolve, reject) => {
      const { WebSocket } = adapters;
      const url = `${server}session?
        appId=${appId}&sdkVersion=${sdkVersion}&protocolVersion=${protocolVersion}&gameVersion=${gameVersion}&
        userId=${userId}&sessionToken=${sessionToken}`;
      debug(`url: ${url}`);
      this._ws = new WebSocket(url, 'protobuf.1');
      this._ws.onopen = () => {
        debug(`${this._userId} : ${this._flag} connection open`);
        this._connected();
      };
      this._ws.onclose = () => {
        reject(
          new PlayError(PlayErrorCode.OPEN_WEBSOCKET_ERROR, 'websocket closed')
        );
      };
      this._ws.onerror = err => {
        reject(err);
      };
      // 标记
      this._requests[0] = {
        resolve,
        reject,
      };
    });
  }

  async createRoom(roomId, roomOptions, expectedUserIds) {
    const req = new RequestMessage();
    const roomOpts = convertToRoomOptions(roomId, roomOptions, expectedUserIds);
    const createRoomReq = new CreateRoomRequest();
    createRoomReq.setRoomOptions(roomOpts);
    req.setCreateRoom(createRoomReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.START,
      req
    );
    return convertToRoom(res.getCreateRoom().getRoomOptions());
  }

  async joinRoom(roomName, matchProperties, expectedUserIds) {
    const req = new RequestMessage();
    const joinRoomReq = new JoinRoomRequest();
    const roomOpts = new RoomOptions();
    roomOpts.setCid(roomName);
    if (matchProperties) {
      joinRoomReq.setExpectAttr(serializeObject(matchProperties));
    }
    if (expectedUserIds) {
      roomOpts.setExpectMembersList(expectedUserIds);
    }
    joinRoomReq.setRoomOptions(roomOpts);
    req.setJoinRoom(joinRoomReq);
    const { res } = await super.sendRequest(CommandType.CONV, OpType.ADD, req);
    return convertToRoom(res.getJoinRoom().getRoomOptions());
  }

  async leaveRoom() {
    const req = new RequestMessage();
    await super.sendRequest(CommandType.CONV, OpType.REMOVE, req);
  }

  async setRoomSystemProps(props) {
    const req = new RequestMessage();
    const updateSysPropertyReq = new UpdateSysPropertyRequest();
    updateSysPropertyReq.setSysAttr(props);
    req.setUpdateSysProperty(updateSysPropertyReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE_SYSTEM_PROPERTY,
      req
    );
    return res.getUpdateSysProperty().getSysAttr();
  }

  async setRoomOpen(open) {
    const sysProps = new RoomSystemProperty();
    const o = new BoolValue();
    o.setValue(open);
    sysProps.setOpen(o);
    const res = await this.setRoomSystemProps(sysProps);
    return res.getOpen().getValue();
  }

  async setRoomVisible(visible) {
    const sysProps = new RoomSystemProperty();
    const v = new BoolValue();
    v.setValue(visible);
    sysProps.setVisible(v);
    const res = await this.setRoomSystemProps(sysProps);
    return res.getVisible().getValue();
  }

  async setRoomMaxPlayerCount(count) {
    const sysProps = new RoomSystemProperty();
    sysProps.setMaxMembers(count);
    const res = await this.setRoomSystemProps(sysProps);
    return res.getMaxMembers();
  }

  async setRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $set: expectedUserIds,
      })
    );
    const res = await this.setRoomSystemProps(sysProps);
    return JSON.parse(res.getExpectMembers());
  }

  async clearRoomExpectedUserIds() {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $drop: true,
      })
    );
    const res = await this.setRoomSystemProps(sysProps);
    return JSON.parse(res.getExpectMembers());
  }

  async addRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $add: expectedUserIds,
      })
    );
    const res = await this.setRoomSystemProps(sysProps);
    return JSON.parse(res.getExpectMembers());
  }

  async removeRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $remove: expectedUserIds,
      })
    );
    const res = await this.setRoomSystemProps(sysProps);
    return JSON.parse(res.getExpectMembers());
  }

  async setMaster(newMasterId) {
    const req = new RequestMessage();
    const updateMasterClientReq = new UpdateMasterClientRequest();
    updateMasterClientReq.setMasterActorId(newMasterId);
    req.setUpdateMasterClient(updateMasterClientReq);
    await super.sendRequest(CommandType.CONV, OpType.UPDATE_MASTER_CLIENT, req);
  }

  async kickPlayer(actorId, code, msg) {
    const req = new RequestMessage();
    const kickReq = new KickMemberRequest();
    kickReq.setTargetActorId(actorId);
    if (code !== null || msg !== null) {
      const appInfo = new AppInfo();
      appInfo.setAppCode(code);
      appInfo.setAppMsg(msg);
      kickReq.setAppInfo(appInfo);
    }
    req.setKickMember(kickReq);
    const { res } = await super.sendRequest(CommandType.CONV, OpType.KICK, req);
    return res.getKickMember().getTargetActorId();
  }

  async sendEvent(eventId, eventData, options) {
    const direct = new DirectCommand();
    direct.setEventId(eventId);
    if (eventData) {
      // 序列化
      direct.setMsg(serializeObject(eventData));
    }
    if (options) {
      direct.setReceiverGroup(options.receiverGroup);
      direct.setToActorIdsList(options.targetActorIds);
    } else {
      direct.setReceiverGroup(ReceiverGroup.All);
    }
    const body = new Body();
    body.setDirect(direct);
    await super.sendCommand(CommandType.DIRECT, OpType.NONE, body);
  }

  async setRoomCustomProperties(properties, expectedValues) {
    const req = new RequestMessage();
    const updatePropsReq = new UpdatePropertyRequest();
    // 序列化属性
    updatePropsReq.setAttr(serializeObject(properties));
    if (expectedValues) {
      // 序列化 CAS 属性
      updatePropsReq.setExpectAttr(serializeObject(expectedValues));
    }
    req.setUpdateProperty(updatePropsReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE,
      req
    );
    // 反序列化 props
    const changedProps = deserializeObject(res.getUpdateProperty().getAttr());
    return changedProps;
  }

  async setPlayerCustomProperties(actorId, properties, expectedValues) {
    const req = new RequestMessage();
    const updatePropsReq = new UpdatePropertyRequest();
    updatePropsReq.setTargetActorId(actorId);
    // 序列化属性
    updatePropsReq.setAttr(serializeObject(properties));
    if (expectedValues) {
      // 序列化 CAS 属性
      updatePropsReq.setExpectAttr(serializeObject(expectedValues));
    }
    req.setUpdateProperty(updatePropsReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE_PLAYER_PROP,
      req
    );
    // 反序列化 actor Id 和属性
    const aId = res.getUpdateProperty().getActorId();
    const changedProps = res.getUpdateProperty().getAttr();
    return {
      actorId: aId,
      changedProps,
    };
  }

  _getPingDuration() {
    return GAME_KEEPALIVE_DURATION;
  }

  _handleNotification(cmd, op, body) {
    switch (cmd) {
      case CommandType.CONV:
        switch (op) {
          case OpType.MEMBERS_JOINED:
            this._handlePlayerJoined(body.getRoomNotification().getJoinRoom());
            break;
          case OpType.MEMBERS_LEFT:
            this._handlePlayerLeftMsg(body.getRoomNotification().getLeftRoom());
            break;
          case OpType.MASTER_CLIENT_CHANGED:
            this._handleMasterChangedMsg(
              body.getRoomNotification().getUpdateMasterClient()
            );
            break;
          case OpType.SYSTEM_PROPERTY_UPDATED_NOTIFY:
            this._handleRoomSystemPropsChangedMsg(
              body.getRoomNotification().getUpdateSysProperty()
            );
            break;
          case OpType.UPDATED_NOTIFY:
            this._handleRoomPropertiesChangedMsg(
              body.getRoomNotification().getUpdateProperty()
            );
            break;
          case OpType.PLAYER_PROPS:
            this._handlePlayerPropertiesChangedMsg(
              body.getRoomNotification().getUpdateProperty()
            );
            break;
          case OpType.MEMBERS_OFFLINE:
            this._handlePlayerOfflineMsg(body.getRoomNotification());
            break;
          case OpType.MEMBERS_ONLINE:
            this._handlePlayerOnlineMsg(body.getRoomNotification());
            break;
          case OpType.KICKED_NOTICE:
            this._handleKickedMsg(body.getRoomNotification());
            break;

          default:
            // super._handleUnknownMsg(msg);
            break;
        }
        break;
      case CommandType.EVENTS:
        // 目前不作处理
        break;
      case CommandType.DIRECT:
        this._handleSendEventMsg(body.getDirect());
        break;
      case CommandType.ERROR:
        super._handleErrorNotify(body);
        break;
      default:
        // super._handleUnknownMsg(msg);
        break;
    }
  }

  _handlePlayerJoined(joinRoomNotification) {
    const newPlayer = convertToPlayer(joinRoomNotification.getMember());
    this.emit(PLAYER_JOINED_EVENT, newPlayer);
  }

  _handlePlayerLeftMsg(leftRoomNotification) {
    const actorId = leftRoomNotification.getActorId();
    this.emit(PLAYER_LEFT_EVENT, actorId);
  }

  _handleMasterChangedMsg(updateMasterCLientNotification) {
    const newMasterId = updateMasterCLientNotification.getMasterActorId();
    this.emit(MASTER_CHANGED_EVENT, newMasterId);
  }

  _handleRoomPropertiesChangedMsg(updatePropertyNotification) {
    // 反序列化
    const changedProps = deserializeObject(
      updatePropertyNotification.getAttr()
    );
    this.emit(ROOM_PROPERTIES_CHANGED_EVENT, changedProps);
  }

  _handlePlayerPropertiesChangedMsg(updatePropertyNotification) {
    // 反序列化
    const actorId = updatePropertyNotification.getActorId();
    const changedProps = deserializeObject(
      updatePropertyNotification.getAttr()
    );
    this.emit(PLAYER_PROPERTIES_CHANGED_EVENT, actorId, changedProps);
  }

  _handlePlayerOfflineMsg(roomNotification) {
    const actorId = roomNotification.getInitByActor();
    this.emit(PLAYER_OFFLINE_EVENT, actorId);
  }

  _handlePlayerOnlineMsg(roomNotification) {
    const joinRoom = roomNotification.getJoinRoom();
    const member = joinRoom.getMember();
    // 更新 Player
    const actorId = member.getActorId();
    const props = deserializeObject(member.getAttr());
    this.emit(PLAYER_ONLINE_EVENT, actorId, props);
  }

  _handleSendEventMsg(directCommand) {
    const eventId = directCommand.getEventId();
    // 反序列化
    let eventData = null;
    if (directCommand.getMsg()) {
      eventData = deserializeObject(directCommand.getMsg());
    }
    const senderId = directCommand.getFromActorId();
    this.emit(SEND_CUSTOM_EVENT, eventId, eventData, senderId);
  }

  _handleKickedMsg(roomNotification) {
    const appInfo = roomNotification.getAppInfo();
    if (appInfo) {
      this.emit(ROOM_KICKED_EVENT, {
        code: appInfo.getAppCode(),
        msg: appInfo.getAppMsg(),
      });
    } else {
      this.emit(ROOM_KICKED_EVENT);
    }
  }

  _handleRoomSystemPropsChangedMsg(updateStsPropertyNotification) {
    const attr = updateStsPropertyNotification.getSysAttr();
    const changedProps = {};
    if (attr.getOpen()) {
      changedProps.open = attr.getOpen().getValue();
    }
    if (attr.getVisible()) {
      changedProps.visible = attr.getVisible().getValue();
    }
    if (attr.getMaxMembers()) {
      changedProps.maxPlayerCount = attr.getMaxMembers();
    }
    if (attr.getExpectMembers()) {
      changedProps.expectedUserIds = JSON.parse(attr.getExpectMembers());
    }
    this.emit(ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT, changedProps);
  }
}
