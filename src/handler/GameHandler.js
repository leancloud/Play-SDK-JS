import Room from '../Room';
import Player from '../Player';
import { handleErrorMsg, handleReasonMsg } from './ErrorHandler';
import Event from '../Event';
import PlayState from '../PlayState';
import { debug, error } from '../Logger';

// 连接建立后创建 / 加入房间
function handleSessionOpen(play, msg) {
  if (msg.reasonCode) {
    play._playState = PlayState.LOBBY_OPEN;
    play._closeGameSocket(() => {
      handleReasonMsg(play, msg);
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
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  } else {
    const actorId = msg.initByActor;
    const leftPlayer = play._room.getPlayer(actorId);
    play._room._removePlayer(actorId);
    play.emit(Event.PLAYER_ROOM_LEFT, {
      leftPlayer,
    });
  }
}

// 主机切换应答
function handleMasterUpdated(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  }
}

// 主机切换
function handleMasterChanged(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  } else if (msg.masterActorId === null) {
    play._room._masterActorId = -1;
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

function handleRoomOpened(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  }
}

// 房间开启 / 关闭
function handleRoomOpenedChanged(play, msg) {
  const { toggle: opened } = msg;
  const changedProps = {
    opened,
  };
  play._room._mergeSystemProperties(changedProps);
  play.emit(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, {
    changedProps,
  });
}

function handleRoomVisiable(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  }
}

// 房间是否可见
function handleRoomVisibleChanged(play, msg) {
  const { toggle: visible } = msg;
  const changedProps = {
    visible,
  };
  play._room._mergeSystemProperties(changedProps);
  play.emit(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, {
    changedProps,
  });
}

// 被踢应答
function handleKickedPlayer(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.ERROR, {
      code: msg.reasonCode,
      detail: msg.detail,
    });
  }
}

// 被踢通知
function handleKickedNotice(play, msg) {
  // 清理工作
  play._room = null;
  play._player = null;
  // 离开房间时就主动断开连接
  play._closeGameSocket(() => {
    // 通过事件通知客户端
    play._connectToMaster(() => {
      play.emit(Event.ROOM_KICKED, {
        code: msg.appCode,
        msg: msg.appMsg,
      });
    });
  });
}

// 更新房间系统属性应答
function handleSystemPropsUpdated(play, msg) {
  if (msg.reasonCode) {
    error(`update system properties error: ${msg.reasonCode}, ${msg.detail}`);
  }
}

// 更新房间系统属性通知
function handleSystemPropsUpdateNotification(play, msg) {
  const { open, visible, expectMembers } = msg.sysAttr;
  const changedProps = {
    opened: open,
    visible,
    expectedUserIds: expectMembers,
  };
  play._room._mergeSystemProperties(changedProps);
  play.emit(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, {
    changedProps,
  });
}

// 房间属性变更应答
function handleRoomCustomPropertiesChangedResponse(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
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
function handlePlayerCustomPropertiesChangedResponse(play, msg) {
  if (msg.reasonCode) {
    handleReasonMsg(play, msg);
  }
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
    play._connectToMaster(() => {
      play.emit(Event.ROOM_LEFT);
    });
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
          handleMasterUpdated(play, msg);
          break;
        case 'master-client-changed':
          handleMasterChanged(play, msg);
          break;
        case 'opened':
          handleRoomOpened(play, msg);
          break;
        case 'opened-notify':
          handleRoomOpenedChanged(play, msg);
          break;
        case 'visible':
          handleRoomVisiable(play, msg);
          break;
        case 'visible-notify':
          handleRoomVisibleChanged(play, msg);
          break;
        case 'updated':
          handleRoomCustomPropertiesChangedResponse(play, msg);
          break;
        case 'updated-notify':
          handleRoomCustomPropertiesChanged(play, msg);
          break;
        case 'player-prop-updated':
          handlePlayerCustomPropertiesChangedResponse(play, msg);
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
        case 'system-property-updated':
          handleSystemPropsUpdated(play, msg);
          break;
        case 'system-property-updated-notify':
          handleSystemPropsUpdateNotification(play, msg);
          break;
        case 'kicked':
          handleKickedPlayer(play, msg);
          break;
        case 'kicked-notice':
          handleKickedNotice(play, msg);
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
