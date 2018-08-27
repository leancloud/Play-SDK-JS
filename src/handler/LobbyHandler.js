import d from 'debug';

import Player from '../Player';
import LobbyRoom from '../LobbyRoom';
import handleErrorMsg from './ErrorHandler';
import Event from '../Event';

const debug = d('Play:MasterHandler');

// 连接建立
function handleSessionOpen(play, msg) {
  play._sessionToken = msg.st;
  const player = new Player(play);
  player._userId = play.userId;
  play._player = player;
  if (play.autoJoinLobby) {
    play.joinLobby();
  }
  if (play._gameToLobby) {
    play.emit(Event.ROOM_LEFT);
    play._gameToLobby = false;
  } else {
    play.emit(Event.CONNECTED);
  }
}

// 加入大厅
function handleJoinedLobby(play, msg) {
  if (msg.reasonCode) {
    const { reasonCode, detail } = msg;
    console.error(`join lobby failed: ${reasonCode} - ${detail}`);
  } else {
    play._inLobby = true;
    play.emit(Event.LOBBY_JOINED);
  }
}

// 离开大厅
function handleLeftLobby(play) {
  play._inLobby = false;
  play.emit(Event.LOBBY_LEFT);
}

// 处理统计信息
function handleStatistic() {}

// 房间列表更新
function handleRoomList(play, msg) {
  play._lobbyRoomList = [];
  for (let i = 0; i < msg.list.length; i += 1) {
    const lobbyRoomDTO = msg.list[i];
    play._lobbyRoomList[i] = new LobbyRoom(lobbyRoomDTO);
  }
  play.emit(Event.LOBBY_ROOM_LIST_UPDATED);
}

function handleGameServer(play, msg) {
  if (play._inLobby) {
    play._inLobby = false;
    play.emit(Event.LOBBY_LEFT);
  }
  play._gameServer = msg.secureAddr;
  if (msg.cid) {
    play._cachedRoomMsg.cid = msg.cid;
  }
  play._connectToGame();
}

// 创建房间
function handleCreateGameServer(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.ROOM_CREATE_FAILED, {
      code: msg.reasonCode,
      detail: msg.detail,
    });
  } else {
    play._cachedRoomMsg.op = 'start';
    handleGameServer(play, msg);
  }
}

// 加入房间
/* eslint no-param-reassign: ["error", { "props": false }] */
function handleJoinGameServer(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.ROOM_JOIN_FAILED, {
      code: msg.reasonCode,
      detail: msg.detail,
    });
  } else {
    play._cachedRoomMsg.op = 'add';
    handleGameServer(play, msg);
  }
}

// 大厅消息处理
export default function handleLobbyMsg(play, message) {
  const msg = JSON.parse(message.data);
  debug(`${play.userId} Lobby msg: ${msg.op} <- ${message.data}`);
  switch (msg.cmd) {
    case 'session':
      switch (msg.op) {
        case 'opened':
          handleSessionOpen(play, msg);
          break;
        default:
          console.error(`no handler for lobby msg: ${msg.op}`);
          break;
      }
      break;
    case 'lobby':
      switch (msg.op) {
        case 'added':
          handleJoinedLobby(play, msg);
          break;
        case 'room-list':
          handleRoomList(play, msg);
          break;
        case 'remove':
          handleLeftLobby(play);
          break;
        default:
          console.error(`no handler for lobby msg: ${msg.op}`);
          break;
      }
      break;
    case 'statistic':
      handleStatistic();
      break;
    case 'conv':
      switch (msg.op) {
        case 'results':
          handleRoomList(play, msg);
          break;
        case 'started':
          handleCreateGameServer(play, msg);
          break;
        case 'added':
          handleJoinGameServer(play, msg);
          break;
        case 'random-added':
          handleJoinGameServer(play, msg);
          break;
        default:
          console.error(`no handler for lobby msg: ${msg.op}`);
          break;
      }
      break;
    case 'events':
      // TODO

      break;
    case 'error':
      handleErrorMsg(play, msg);
      break;
    default:
      if (msg.cmd) {
        console.error(`no handler for lobby msg: ${msg.cmd}`);
      }
      break;
  }
}
