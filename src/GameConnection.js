import Connection, { convertToRoomOptions } from './Connection';
import Room from './Room';
import Player from './Player';
import { debug } from './Logger';
import ReceiverGroup from './ReceiverGroup';

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
  player.active = !member.getInactive();
  // TODO 属性

  return player;
}

function convertToRoom(roomOptions) {
  const room = new Room();
  room._name = roomOptions.getCid();
  room._open = roomOptions.getOpen();
  room._visible = roomOptions.getVisible();
  room._maxPlayerCount = roomOptions.getMaxMembers();
  room._masterActorId = roomOptions.getMasterActorId();
  room._expectedUserIds = roomOptions.getExpectMembersList();
  room._players = {};
  roomOptions.getMembersList().forEach(member => {
    const player = convertToPlayer(member);
    room._players[player.actorId] = player;
  });
  // TODO

  // if (roomJSONObject.attr) {
  //   room._properties = roomJSONObject.attr;
  // } else {
  //   room._properties = {};
  // }
  return room;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class GameConnection extends Connection {
  constructor() {
    super();
    this._flag = 'game';
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
    const roomOpts = new RoomOptions();
    roomOpts.setCid(roomName);
    if (matchProperties) {
      // TODO
    }
    if (expectedUserIds) {
      roomOpts.setExpectMembersList(expectedUserIds);
    }
    const joinRoomRequest = new JoinRoomRequest();
    joinRoomRequest.setRoomOptions(roomOpts);
    req.setJoinRoom(joinRoomRequest);
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
    await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE_SYSTEM_PROPERTY,
      req
    );
  }

  async setRoomOpen(open) {
    const sysProps = new RoomSystemProperty();
    sysProps.setOpen(open);
    await this.setRoomSystemProps(sysProps);
  }

  async setRoomVisible(visible) {
    const sysProps = new RoomSystemProperty();
    sysProps.setVisible(visible);
    await this.setRoomSystemProps(sysProps);
  }

  async setRoomMaxPlayerCount(count) {
    const sysProps = new RoomSystemProperty();
    sysProps.setMaxMembers(count);
    await this.setRoomSystemProps(sysProps);
  }

  async setRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $set: expectedUserIds,
      })
    );
    await this.setRoomSystemProps(sysProps);
  }

  async clearRoomExpectedUserIds() {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $drop: true,
      })
    );
    await this.setRoomSystemProps(sysProps);
  }

  async addRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $add: expectedUserIds,
      })
    );
    await this.setRoomSystemProps(sysProps);
  }

  async removeRoomExpectedUserIds(expectedUserIds) {
    const sysProps = new RoomSystemProperty();
    sysProps.setExpectMembers(
      JSON.stringify({
        $remove: expectedUserIds,
      })
    );
    await this.setRoomSystemProps(sysProps);
  }

  async setMaster(newMasterId) {
    const req = new RequestMessage();
    const updateMasterClientReq = new UpdateMasterClientRequest();
    updateMasterClientReq.setMasterActorId(newMasterId);
    req.setUpdateMasterClient(updateMasterClientReq);
    await super.sendRequest(req);
  }

  async kickPlayer(actorId, code, msg) {
    const req = new RequestMessage();
    const kickReq = new KickMemberRequest();
    kickReq.setTargetActorId(actorId);
    const appInfo = new AppInfo();
    appInfo.setAppCode(code);
    appInfo.setAppMsg(msg);
    kickReq.setAppInfo(appInfo);
    await super.sendRequest(CommandType.CONV, OpType.KICK, req);
  }

  async sendEvent(eventId, eventData, options) {
    const direct = new DirectCommand();
    direct.setEventId(eventId);
    if (eventData) {
      // TODO 序列化
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
    // TODO 序列化属性

    if (expectedValues) {
      // TODO 序列化 CAS 属性
    }
    req.setUpdateProperty(updatePropsReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE,
      req
    );
    // TODO 反序列化 props

    return res;
  }

  async setPlayerCustomProperties(actorId, properties, expectedValues) {
    const req = new RequestMessage();
    const updatePropsReq = new UpdatePropertyRequest();
    updatePropsReq.setTargetActorId(actorId);
    // TODO 序列化属性

    if (expectedValues) {
      // TODO 序列化 CAS 属性
    }
    req.setUpdateProperty(updatePropsReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE_PLAYER_PROP,
      req
    );
    // TODO 反序列化 actor Id 和属性

    return res;
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
            // TODO
            this._handlePlayerOfflineMsg();
            break;
          case OpType.MEMBERS_ONLINE:
            // TODO
            this._handlePlayerOnlineMsg();
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
    // TODO 反序列化
    const changedProps = updatePropertyNotification.getAttr();
    this.emit(ROOM_PROPERTIES_CHANGED_EVENT, changedProps);
  }

  _handlePlayerPropertiesChangedMsg(updatePropertyNotification) {
    // TODO 反序列化
    const actorId = 0;
    const changedProps = updatePropertyNotification.getAttr();
    this.emit(PLAYER_PROPERTIES_CHANGED_EVENT, actorId, changedProps);
  }

  _handlePlayerOfflineMsg(roomNotification) {
    const actorId = roomNotification.getInitByActor();
    this.emit(PLAYER_OFFLINE_EVENT, actorId);
  }

  _handlePlayerOnlineMsg(roomNotification) {
    const actorId = roomNotification.getInitByActor();
    // TODO 更新 / 新建 Player
    this.emit(PLAYER_ONLINE_EVENT, actorId);
  }

  _handleSendEventMsg(directCommand) {
    const eventId = directCommand.getEventId();
    // TODO 反序列化

    const senderId = directCommand.getFromActorId();
    this.emit(SEND_CUSTOM_EVENT, eventId, null, senderId);
  }

  _handleKickedMsg(roomNotification) {
    const appInfo = roomNotification.getAppInfo();
    // TODO

    this.emit(ROOM_KICKED_EVENT, appInfo);
  }

  _handleRoomSystemPropsChangedMsg(updateStsPropertyNotification) {
    // TODO 反序列化

    const { sysAttr } = updateStsPropertyNotification;
    const changedProps = {
      open: sysAttr.open,
      visible: sysAttr.visible,
      maxPlayerCount: sysAttr.maxMembers,
      expectedUserIds: sysAttr.expectMembers,
    };
    this.emit(ROOM_SYSTEM_PROPERTIES_CHANGED_EVENT, changedProps);
  }
}
