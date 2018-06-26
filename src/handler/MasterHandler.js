import { Room } from '../Room';
import { Player } from '../Player';
import { LobbyRoom } from '../LobbyRoom';
import { handleErrorMsg } from './ErrorHandler';
import { Event } from '../Event';

// 大厅消息处理
function handleMasterMsg(play, message) {
  var msg = JSON.parse(message.data);
  console.log(play.userId + ' Lobby msg: ' + msg.op + ' <- ' + message.data);
  switch (msg.cmd) {
    case 'session':
      {
        switch (msg.op) {
          case 'opened':
            handleMasterServerSessionOpen(play, msg);
            break;
          default:
            console.error('no handler for lobby msg: ' + msg.op);
            break;
        }
      }
      break;
    case 'lobby':
      {
        switch (msg.op) {
          case 'added':
            handleJoinedLobby(play, msg);
            break;
          case 'room-list':
            handleRoomList(play, msg);
            break;
          case 'remove':
            handleLeftLobby(play, msg);
            break;
          default:
            console.error('no handler for lobby msg: ' + msg.op);
            break;
        }
      }
      break;
    case 'conv':
      {
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
            console.error('no handler for lobby msg: ' + msg.op);
            break;
        }
      }
      break;
    case 'events':
      // TODO

      break;
    case 'error':
      {
        handleErrorMsg(play, msg);
      }
      break;
    default:
      if (msg.cmd) {
        console.error('no handler for lobby msg: ' + msg.cmd);
      }
      break;
  }
}

// 连接建立
function handleMasterServerSessionOpen(play, msg) {
  play._sessionToken = msg.st;
  var player = new Player(play);
  player.userId = play.userId;
  play.player = player;
  if (play._autoJoinLobby) {
    play.joinLobby();
  }
}

// 加入大厅
function handleJoinedLobby(play, msg) {
  play.emit(Event.OnJoinedLobby);
}

// 离开大厅
function handleLeftLobby(play, msg) {
  play.emit(Event.OnLeftLobby);
}

// 房间列表更新
function handleRoomList(play, msg) {
  play.lobbyRoomList = [];
  for (var i = 0; i < msg.list.length; i++) {
    var lobbyRoomDTO = msg.list[i];
    play.lobbyRoomList[i] = new LobbyRoom(lobbyRoomDTO);
  }
  play.emit(Event.OnLobbyRoomListUpdate);
}

// 创建房间
function handleCreateGameServer(play, msg) {
  if (msg.reasonCode) {
    var code = msg.reasonCode;
    var detail = msg.detail;
    play.emit(Event.OnCreateRoomFailed, code, detail);
  } else {
    play._cachedRoomMsg.op = 'start';
    handleGameServer(play, msg);
  }
}

// 加入房间
function handleJoinGameServer(play, msg) {
  if (msg.reasonCode) {
    var code = msg.reasonCode;
    var detail = msg.detail;
    play.emit(Event.OnJoinRoomFailed, code, detail);
  } else {
    play._cachedRoomMsg.op = 'add';
    handleGameServer(play, msg);
  }
}

function handleGameServer(play, msg) {
  play._gameAddr = msg.addr;
  play._secureGameAddr = msg.secureAddr;
  if (msg.cid) play._cachedRoomMsg.cid = msg.cid;
  play.connectToGame();
}

export { handleMasterMsg };
