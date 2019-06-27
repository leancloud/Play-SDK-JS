import PlayError from './PlayError';
import Connection, {
  convertRoomOptions,
  convertToRoomOptions,
} from './Connection';
import LobbyRoom from './LobbyRoom';
import { debug } from './Logger';

const messages = require('./proto/messages_pb');

const {
  CommandType,
  OpType,
  RequestMessage,
  CreateRoomRequest,
  JoinRoomRequest,
  RoomOptions,
} = messages;

const LOBBY_KEEPALIVE_DURATION = 120000;

// 大厅连接抛出的事件
export const ROOM_LIST_UPDATED_EVENT = 'ROOM_LIST_UPDATED_EVENT';

function convertToLobbyRoom(roomOptions) {
  const lobbyRoom = new LobbyRoom();
  lobbyRoom._roomName = roomOptions.getCid();
  lobbyRoom._visible = roomOptions.getVisible();
  lobbyRoom._open = roomOptions.getOpen();
  lobbyRoom._maxPlayerCount = roomOptions.getMaxMembers();
  lobbyRoom._expectedUserIds = roomOptions.getExpectMembersList();
  lobbyRoom._emptyRoomTtl = roomOptions.getEmptyRoomTtl();
  lobbyRoom._playerTtl = roomOptions.getPlayerTtl();
  lobbyRoom._playerCount = roomOptions.getMemberCount();
  // TODO
  // lobbyRoom._customRoomProperties = lobbyRoomDTO.attr;
  return lobbyRoom;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class LobbyConnection extends Connection {
  constructor() {
    super();
    this._flag = 'lobby';
  }

  async joinLobby() {
    const req = new RequestMessage();
    await super.sendRequest(CommandType.LOBBY, OpType.ADD, req);
  }

  async leaveLobby() {
    const req = new RequestMessage();
    await super.sendRequest(CommandType.LOBBY, OpType.REMOVE, req);
  }

  async createRoom(roomName, roomOptions, expectedUserIds) {
    const req = new RequestMessage();
    const roomOpts = convertToRoomOptions(
      roomName,
      roomOptions,
      expectedUserIds
    );
    const createRoomReq = new CreateRoomRequest();
    createRoomReq.setRoomOptions(roomOpts);
    req.setCreateRoom(createRoomReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.START,
      req
    );
    const roomRes = res.getCreateRoom();
    return {
      cid: roomRes.getRoomOptions().getCid(),
      addr: roomRes.getAddr(),
    };
  }

  async joinRoom(roomName, expectedUserIds) {
    const req = new RequestMessage();
    const roomOpts = new RoomOptions();
    roomOpts.setCid(roomName);
    if (expectedUserIds) {
      roomOpts.setExpectMembers(expectedUserIds);
    }
    const joinRoomReq = new JoinRoomRequest();
    joinRoomReq.setRoomOptions(roomOpts);
    req.setJoinRoom(joinRoomReq);
    const { res } = await super.sendRequest(CommandType.CONV, OpType.ADD, req);
    const roomRes = res.getJoinRoom();
    return {
      cid: roomRes.getRoomOptions().getCid(),
      addr: roomRes.getAddr(),
    };
  }

  async joinOrCreateRoom(roomName, roomOptions, expectedUserIds) {
    const req = new RequestMessage();
    const joinRoomReq = new JoinRoomRequest();
    const roomOpts = convertToRoomOptions(
      roomName,
      roomOptions,
      expectedUserIds
    );
    joinRoomReq.setRoomOptions(roomOpts);
    joinRoomReq.setCreateOnNotFound(true);
    req.setJoinRoom(joinRoomReq);
    const { op, res } = await super.sendRequest(
      CommandType.CONV,
      OpType.ADD,
      req
    );
    if (op === OpType.STARTED) {
      const roomRes = res.getCreateRoom();
      return {
        op,
        cid: roomRes.getRoomOptions().getCid(),
        addr: roomRes.getAddr(),
      };
    }
    const roomRes = res.getJoinRoom();
    return {
      op,
      cid: roomRes.getRoomOptions().getCid(),
      addr: roomRes.getAddr(),
    };
  }

  async joinRandomRoom(matchProperties, expectedUserIds) {
    const req = new RequestMessage();
    const joinRoomReq = new JoinRoomRequest();
    if (matchProperties) {
      // TODO 序列化
    }
    if (expectedUserIds) {
      const roomOpts = new RoomOptions();
      roomOpts.setExpectMembers(expectedUserIds);
      joinRoomReq.setRoomOptions(roomOpts);
    }
    const { res } = await this.sendRequest(
      CommandType.CONV,
      OpType.ADD_RANDOM,
      req
    );
    const roomRes = res.getJoinRoom();
    return {
      cid: roomRes.getRoomOptions().getCid(),
      addr: roomRes.getAddr(),
    };
  }

  async rejoinRoom(roomName) {
    const req = new RequestMessage();
    const joinRoomReq = new JoinRoomRequest();
    joinRoomReq.setRejoin(true);
    const roomOpts = new RoomOptions();
    roomOpts.setCid(roomName);
    joinRoomReq.setRoomOptions(roomOpts);
    req.setJoinRoom(joinRoomReq);
    const { res } = await super.sendRequest(CommandType.CONV, OpType.ADD, req);
    const roomRes = res.getJoinRoom();
    return {
      cid: roomRes.getRoomOptions().getCid(),
      addr: roomRes.getAddr(),
    };
  }

  async matchRandom(piggybackPeerId, matchProperties) {
    const req = new RequestMessage();
    const joinRoomReq = new JoinRoomRequest();
    joinRoomReq.setPiggybackPeerId(piggybackPeerId);
    if (matchProperties) {
      // TODO 序列化
    }
    req.setJoinRoom(joinRoomReq);
    const { res } = await super.sendRequest(
      CommandType.CONV,
      OpType.MATCH_RANDOM,
      req
    );
    // TODO return
    const roomRes = res.getJoinRoom();
    return convertToLobbyRoom(roomRes.getRoomOptions());
  }

  _getPingDuration() {
    return LOBBY_KEEPALIVE_DURATION;
  }

  // 处理被动通知消息
  _handleNotification(cmd, op, body) {
    switch (cmd) {
      case CommandType.LOBBY:
        switch (op) {
          case OpType.ROOM_LIST:
            this._handleRoomListMsg(body);
            break;
          default:
            super._handleUnknownMsg(cmd, op, body);
            break;
        }
        break;
      case CommandType.STATISTIC:
        // 目前不作处理
        break;
      case CommandType.ERROR:
        super._handleErrorNotify(body);
        break;
      default:
        super._handleUnknownMsg(cmd, op, body);
        break;
    }
  }

  _handleRoomListMsg(body) {
    const roomList = [];
    const list = body.getRoomList().getList();
    list.forEach(roomOptions => {
      const lobbyRoom = convertToLobbyRoom(roomOptions);
      roomList.push(lobbyRoom);
    });
    this.emit(ROOM_LIST_UPDATED_EVENT, roomList);
  }
}
