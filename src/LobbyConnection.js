import Connection from './Connection';
import LobbyRoom from './LobbyRoom';
import { deserializeObject } from './CodecUtils';
import { sdkVersion, protocolVersion } from './Config';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';
import proto from './proto/messages_pb';

const {
  CommandType,
  OpType,
  RequestMessage,
} = proto.game_protobuf_messages.proto.messages;

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
  lobbyRoom._customRoomProperties = deserializeObject(roomOptions.getAttr());
  return lobbyRoom;
}

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration", "_getFastOpenUrl"] }] */
export default class LobbyConnection extends Connection {
  constructor() {
    super();
    this._flag = 'lobby';
  }

  async joinLobby() {
    if (!this._fsm.is('connected')) {
      throw new PlayError(
        PlayErrorCode.STATE_ERROR,
        `Error state: ${this._fsm.state}`
      );
    }
    const req = new RequestMessage();
    await super.sendRequest(CommandType.LOBBY, OpType.ADD, req);
  }

  async leaveLobby() {
    if (!this._fsm.is('connected')) {
      throw new PlayError(
        PlayErrorCode.STATE_ERROR,
        `Error state: ${this._fsm.state}`
      );
    }
    const req = new RequestMessage();
    await super.sendRequest(CommandType.LOBBY, OpType.REMOVE, req);
  }

  _getFastOpenUrl(server, appId, gameVersion, userId, sessionToken) {
    return `${server}/1/multiplayer/lobby/websocket?appId=${appId}&sdkVersion=${sdkVersion}&protocolVersion=${protocolVersion}&gameVersion=${gameVersion}&userId=${userId}&sessionToken=${sessionToken}`;
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
        super._handleErrorNotify(body.getError());
        break;
      default:
        super._handleUnknownMsg(cmd, op, body);
        break;
    }
  }

  _handleRoomListMsg(body) {
    const roomList = [];
    const list = body.getRoomList().getListList();
    list.forEach(roomOptions => {
      const lobbyRoom = convertToLobbyRoom(roomOptions);
      roomList.push(lobbyRoom);
    });
    this.emit(ROOM_LIST_UPDATED_EVENT, roomList);
  }
}
