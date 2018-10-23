import Room from '../Room';
import Player from '../Player';
import handleErrorMsg from './ErrorHandler';
import Event from '../Event';
import PlayState from '../PlayState';
import { debug, error } from '../Logger';

// 连接建立后创建 / 加入房间
function handleSessionOpen(play, msg) {
  if (msg.reasonCode) {
    play._playState = PlayState.LOBBY_OPEN;
    play._closeGameSocket(() => {
      play.emit(Event.ERROR, {
        code: msg.reasonCode,
        detail: msg.detail,
      });
    });
  } else {
    // 根据缓存加入房间的规则
    play._cachedRoomMsg.i = play._getMsgId();
    play._sendGameMessage(play._cachedRoomMsg);
  }
}

function handleSessionClose(play) {
  // 收到 closed 协议后，客户端主动断开连接
  play._closeGameSocket();
}

// 创建房间
function handleCreatedRoom(play, msg) {
  if (msg.reasonCode) {
    play._playState = PlayState.LOBBY_OPEN;
    play._closeGameSocket(() => {
      play.emit(Event.ROOM_CREATE_FAILED, {
        code: msg.reasonCode,
        detail: msg.detail,
      });
    });
  } else {
    play._playState = PlayState.GAME_OPEN;
    play._room = Room._newFromJSONObject(play, msg);
    play.emit(Event.ROOM_CREATED);
    play.emit(Event.ROOM_JOINED);
    play._closeLobbySocket();
  }
}

// 加入房间
function handleJoinedRoom(play, msg) {
  if (msg.reasonCode) {
    play._playState = PlayState.LOBBY_OPEN;
    play._closeGameSocket(() => {
      play.emit(Event.ROOM_JOIN_FAILED, {
        code: msg.reasonCode,
        detail: msg.detail,
      });
    });
  } else {
    play._playState = PlayState.GAME_OPEN;
    play._room = Room._newFromJSONObject(play, msg);
    play.emit(Event.ROOM_JOINED);
    play._closeLobbySocket();
  }
}

// 有新玩家加入房间
function handleNewPlayerJoinedRoom(play, msg) {
  const newPlayer = Player._newFromJSONObject(play, msg.member);
  play._room._addPlayer(newPlayer);
  play.emit(Event.PLAYER_ROOM_JOINED, {
    newPlayer,
  });
}

// 有玩家离开房间
function handlePlayerLeftRoom(play, msg) {
  const actorId = msg.initByActor;
  const leftPlayer = play._room.getPlayer(actorId);
  play._room._removePlayer(actorId);
  play.emit(Event.PLAYER_ROOM_LEFT, {
    leftPlayer,
  });
}

// 主机切换应答
function handleMasterUpdated(msg) {
  if (msg.reasonCode) {
    error(`set master error: ${msg.reasonCode}, ${msg.detail}`);
  }
}

// 主机切换
function handleMasterChanged(play, msg) {
  if (play === null) {
    debug('play is null');
  } else if (play._room === null) {
    debug('play _room is null');
    debug(play.userId);
  }
  if (msg.masterActorId === null) {
    play.emit(Event.MASTER_SWITCHED, {
      newMaster: null,
    });
  } else {
    play._room._masterActorId = msg.masterActorId;
    const newMaster = play._room.getPlayer(msg.masterActorId);
    play.emit(Event.MASTER_SWITCHED, {
      newMaster,
    });
  }
}

// 房间开启 / 关闭
function handleRoomOpenedChanged(play, msg) {
  const opened = msg.toggle;
  play._room._opened = opened;
  play.emit(Event.ROOM_OPEN_CHANGED, {
    opened,
  });
}

// 房间是否可见
function handleRoomVisibleChanged(play, msg) {
  const visible = msg.toggle;
  play._room._visible = visible;
  play.emit(Event.ROOM_VISIBLE_CHANGED, {
    visible,
  });
}

// 房间属性变更应答
function handleRoomCustomPropertiesChangedResponse(msg) {
  if (msg.reasonCode) {
    error(`set room properties error: ${msg.reasonCode}, ${msg.detail}`);
  }
}

// 房间属性变更
function handleRoomCustomPropertiesChanged(play, msg) {
  const changedProps = msg.attr;
  play._room._mergeProperties(changedProps);
  play.emit(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, {
    changedProps,
  });
}

// 玩家属性变更应答
function handlePlayerCustomPropertiesChangedResponse() {
  // nothing
}

// 玩家属性变更
function handlePlayerCustomPropertiesChanged(play, msg) {
  const player = play._room.getPlayer(msg.actorId);
  player._mergeProperties(msg.attr);
  play.emit(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, {
    player,
    changedProps: msg.attr,
  });
}

// 玩家下线
function handlePlayerOffline(play, msg) {
  const player = play._room.getPlayer(msg.initByActor);
  player._setActive(false);
  play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
    player,
  });
}

// 玩家上线
function handlePlayerOnline(play, msg) {
  const player = play._room.getPlayer(msg.member.actorId);
  player._initWithJSONObject(msg.member);
  player._setActive(true);
  play.emit(Event.PLAYER_ACTIVITY_CHANGED, {
    player,
  });
}

// 离开房间
/* eslint no-param-reassign: ["error", { "props": false }] */
function handleLeaveRoom(play) {
  // 清理工作
  play._room = null;
  play._player = null;
  // 离开房间时就主动断开连接
  play._closeGameSocket(() => {
    play._connectToMaster(true);
  });
}

// 自定义事件
function handleEvent(play, msg) {
  play.emit(Event.CUSTOM_EVENT, {
    eventId: msg.eventId,
    eventData: msg.msg,
    senderId: msg.fromActorId,
  });
}

export default function handleGameMsg(play, message) {
  const msg = JSON.parse(message.data);
  debug(`${play.userId} Game  msg: ${msg.op} \n<- ${message.data}`);
  switch (msg.cmd) {
    case 'session':
      switch (msg.op) {
        case 'opened':
          handleSessionOpen(play, msg);
          break;
        case 'closed':
          handleSessionClose(play);
          break;
        default:
          error(`no handler for op: ${msg.op}`);
          break;
      }
      break;
    case 'conv':
      switch (msg.op) {
        case 'started':
          handleCreatedRoom(play, msg);
          break;
        case 'added':
          handleJoinedRoom(play, msg);
          break;
        case 'members-joined':
          handleNewPlayerJoinedRoom(play, msg);
          break;
        case 'members-left':
          handlePlayerLeftRoom(play, msg);
          break;
        case 'master-client-updated':
          handleMasterUpdated(msg);
          break;
        case 'master-client-changed':
          handleMasterChanged(play, msg);
          break;
        case 'opened':
          break;
        case 'opened-notify':
          handleRoomOpenedChanged(play, msg);
          break;
        case 'visible':
          break;
        case 'visible-notify':
          handleRoomVisibleChanged(play, msg);
          break;
        case 'updated':
          handleRoomCustomPropertiesChangedResponse(msg);
          break;
        case 'updated-notify':
          handleRoomCustomPropertiesChanged(play, msg);
          break;
        case 'player-prop-updated':
          handlePlayerCustomPropertiesChangedResponse();
          break;
        case 'player-props':
          handlePlayerCustomPropertiesChanged(play, msg);
          break;
        case 'members-offline':
          handlePlayerOffline(play, msg);
          break;
        case 'members-online':
          handlePlayerOnline(play, msg);
          break;
        case 'removed':
          handleLeaveRoom(play);
          break;
        default:
          error(`no handler for game msg: ${msg.op}`);
          break;
      }
      break;
    case 'direct':
      handleEvent(play, msg);
      break;
    case 'ack':
      // ignore
      break;
    case 'events':
      // TODO

      break;
    case 'error':
      handleErrorMsg(play, msg);
      break;
    default:
      if (msg.cmd) {
        error(`no handler for cmd: ${message.data}`);
      }
      break;
  }
}
