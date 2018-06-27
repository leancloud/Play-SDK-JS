import Player from '../Player';
import LobbyRoom from '../LobbyRoom';
import handleErrorMsg from './ErrorHandler';
import Event from '../Event';

// 连接建立
function handleMasterServerSessionOpen(play, msg) {
  play._sessionToken = msg.st;
  const player = new Player(play);
  player.userId = play.userId;
  play.player = player;
  play.emit(Event.OnConnected);
  if (play._autoJoinLobby) {
    play.joinLobby();
  }
}

// 加入大厅
function handleJoinedLobby(play) {
  play.emit(Event.OnJoinedLobby);
}

// 离开大厅
function handleLeftLobby(play) {
  play.emit(Event.OnLeftLobby);
}

// 房间列表更新
function handleRoomList(play, msg) {
  play.lobbyRoomList = [];
  for (let i = 0; i < msg.list.length; i += 1) {
    const lobbyRoomDTO = msg.list[i];
    play.lobbyRoomList[i] = new LobbyRoom(lobbyRoomDTO);
  }
  play.emit(Event.OnLobbyRoomListUpdate);
}

function handleGameServer(play, msg) {
  play._gameAddr = msg.addr;
  play._secureGameAddr = msg.secureAddr;
  if (msg.cid) play._cachedRoomMsg.cid = msg.cid;
  play._connectToGame();
}

// 创建房间
function handleCreateGameServer(play, msg) {
  if (msg.reasonCode) {
    const { reasonCode: code, detail: failedDetail } = msg;
    play.emit(Event.OnCreateRoomFailed, code, failedDetail);
  } else {
    play._cachedRoomMsg.op = 'start';
    handleGameServer(play, msg);
  }
}

// 加入房间
/* eslint no-param-reassign: ["error", { "props": false }] */
function handleJoinGameServer(play, msg) {
  if (msg.reasonCode) {
    const { reasonCode: code, detail: failedDetail } = msg;
    play.emit(Event.OnJoinRoomFailed, code, failedDetail);
  } else {
    play._cachedRoomMsg.op = 'add';
    handleGameServer(play, msg);
  }
}

// 大厅消息处理
export default function handleMasterMsg(play, message) {
  const msg = JSON.parse(message.data);
  console.warn(`${play.userId} Lobby msg: ${msg.op} <- ${message.data}`);
  switch (msg.cmd) {
    case 'session':
      switch (msg.op) {
        case 'opened':
          handleMasterServerSessionOpen(play, msg);
          break;
        default:
          console.error(`no handler for lobby msg: ${msg.op}`);
          break;
      }
      break;
    case 'lobby':
      switch (msg.op) {
        case 'added':
          handleJoinedLobby(play);
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
