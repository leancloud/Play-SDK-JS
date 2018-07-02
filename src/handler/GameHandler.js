import Room from '../Room';
import Player from '../Player';
import handleErrorMsg from './ErrorHandler';
import Event from '../Event';

const debug = require('debug')('handler');

// 连接建立后创建 / 加入房间
function handleGameServerSessionOpen(play) {
  // 根据缓存加入房间的规则
  play._cachedRoomMsg.i = play._getMsgId();
  play._send(play._cachedRoomMsg);
}

// 创建房间
function handleCreatedRoom(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.CREATE_ROOM_FAILED, {
      code: msg.reasonCode,
      detail: msg.detail,
    });
  } else {
    play._room = Room.newFromJSONObject(play, msg);
    play.emit(Event.CREATED_ROOM);
    play.emit(Event.JOINED_ROOM);
  }
}

// 加入房间
function handleJoinedRoom(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.JOIN_ROOM_FAILED, {
      code: msg.reasonCode,
      detail: msg.detail,
    });
  } else {
    play._room = Room.newFromJSONObject(play, msg);
    play.emit(Event.JOINED_ROOM);
  }
}

// 有新玩家加入房间
function handleNewPlayerJoinedRoom(play, msg) {
  const newPlayer = Player.newFromJSONObject(play, msg.member);
  play._room.addPlayer(newPlayer);
  play.emit(Event.NEW_PLAYER_JOINED_ROOM, newPlayer);
}

// 有玩家离开房间
function handlePlayerLeftRoom(play, msg) {
  const actorId = msg.initByActor;
  const leftPlayer = play._room.getPlayer(actorId);
  play._room.removePlayer(actorId);
  play.emit(Event.PLAYER_LEFT_ROOM, leftPlayer);
}

// 主机切换
function handleMasterChanged(play, msg) {
  play._room._setMasterId(msg.masterActorId);
  const newMaster = play._room.getPlayer(msg.masterActorId);
  play.emit(Event.MASTER_SWITCHED, newMaster);
}

// 房间开启 / 关闭
function handleRoomOpenedChanged(play, msg) {
  const opened = msg.toggle;
  play._room._setOpened(opened);
}

// 房间是否可见
function handleRoomVisibleChanged(play, msg) {
  const visible = msg.toggle;
  play._room._setVisible(visible);
}

// 房间属性变更
function handleRoomCustomPropertiesChanged(play, msg) {
  const changedProperties = msg.attr;
  play._room._mergeProperties(changedProperties);
  play.emit(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, changedProperties);
}

// 玩家属性变更
function handlePlayerCustomPropertiesChanged(play, msg) {
  const player = play._room.getPlayer(msg.initByActor);
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
  play.emit(Event.PLAYER_ACTIVITY_CHANGED, player);
}

// 玩家上线
function handlePlayerOnline(play, msg) {
  const player = play._room.getPlayer(msg.member.actorId);
  player.initWithJSONObject(msg.member);
  player._setActive(true);
  play.emit(Event.PLAYER_ACTIVITY_CHANGED, player);
}

// 离开房间
/* eslint no-param-reassign: ["error", { "props": false }] */
function handleLeaveRoom(play) {
  // 清理工作
  play._room = null;
  play._player = null;
  play.emit(Event.LEFT_ROOM);
  play._connectToMaster();
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
  debug(`${play.userId} Game msg: ${msg.op} <- ${message.data}`);
  switch (msg.cmd) {
    case 'session':
      switch (msg.op) {
        case 'opened':
          handleGameServerSessionOpen(play);
          break;
        default:
          console.error(`no handler for op: ${msg.op}`);
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
        // case 'master-client-updated':
        //   handleMasterUpdate(play, msg);
        //   break;
        case 'master-client-changed':
          handleMasterChanged(play, msg);
          break;
        case 'open':
          handleRoomOpenedChanged(play, msg);
          break;
        case 'visible':
          handleRoomVisibleChanged(play, msg);
          break;
        case 'updated-notify':
          handleRoomCustomPropertiesChanged(play, msg);
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
        case 'direct':
          handleEvent(play, msg);
          break;
        default:
          console.error(`no handler for game msg: ${msg.op}`);
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
        console.error(`no handler for cmd: ${message.data}`);
      }
      break;
  }
}
