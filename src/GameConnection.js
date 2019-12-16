import queryString from 'query-string';
import Connection from './Connection';
import ReceiverGroup from './ReceiverGroup';
import { deserializeObject, serializeObject } from './CodecUtils';
import { sdkVersion, protocolVersion } from './Config';
import proto from './proto/messages_pb';

const { BoolValue } = proto;
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
} = proto.game_protobuf_messages.proto.messages;

const GAME_KEEPALIVE_DURATION = 7000;

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

const MAX_PLAYER_COUNT = 10;

export function convertToRoomOptions(roomName, options, expectedUserIds) {
  const roomOptions = new RoomOptions();
  if (roomName) {
    roomOptions.setCid(roomName);
  }
  if (options) {
    const {
      open,
      visible,
      emptyRoomTtl,
      playerTtl,
      maxPlayerCount,
      customRoomProperties,
      customRoomPropertyKeysForLobby,
      flag,
      pluginName,
    } = options;
    if (open !== undefined) {
      const o = new BoolValue();
      o.setValue(open);
      roomOptions.setOpen(o);
    }
    if (visible !== undefined) {
      const v = new BoolValue();
      v.setValue(visible);
      roomOptions.setVisible(v);
    }
    if (emptyRoomTtl > 0) {
      roomOptions.setEmptyRoomTtl(emptyRoomTtl);
    }
    if (playerTtl > 0) {
      roomOptions.setPlayerTtl(playerTtl);
    }
    if (maxPlayerCount > 0 && maxPlayerCount < MAX_PLAYER_COUNT) {
      roomOptions.setMaxMembers(maxPlayerCount);
    }
    if (customRoomProperties) {
      roomOptions.setAttr(serializeObject(customRoomProperties));
    }
    if (customRoomPropertyKeysForLobby) {
      roomOptions.setLobbyAttrKeysList(customRoomPropertyKeysForLobby);
    }
    if (flag !== undefined) {
      roomOptions.setFlag(flag);
    }
    if (pluginName) {
      roomOptions.setPluginName(pluginName);
    }
  }
  if (expectedUserIds) {
    roomOptions.setExpectMembersList(expectedUserIds);
  }
  return roomOptions;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration", "_getFastOpenUrl"] }] */
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
    return res.getCreateRoom().getRoomOptions();
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
    return res.getJoinRoom().getRoomOptions();
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
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.UPDATE_MASTER_CLIENT,
      req
    );
    return res.getUpdateMasterClient().getMasterActorId();
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

  _getFastOpenUrl(server, appId, gameVersion, userId, sessionToken) {
    const parsedUrl = queryString.parseUrl(server);
    const { url, query } = parsedUrl;
    const queries = Object.assign(query, {
      appId,
      sdkVersion,
      protocolVersion,
      gameVersion,
      userId,
      sessionToken,
    });
    return `${url}session?${queryString.stringify(queries)}`;
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
    this.emit(PLAYER_JOINED_EVENT, joinRoomNotification.getMember());
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
