import Room from '../Room';
import Player from '../Player';
import handleErrorMsg from './ErrorHandler';
import Event from '../Event';

// 连接建立后创建 / 加入房间
function handleGameServerSessionOpen(play) {
  // 根据缓存加入房间的规则
  play._cachedRoomMsg.i = play.getMsgId();
  play.send(play._cachedRoomMsg);
}

// 创建房间
function handleCreatedRoom(play, msg) {
  if (msg.reasonCode) {
    const { reasonCode: code, detail: failedDetail } = msg;
    play.emit(Event.OnCreateRoomFailed, code, failedDetail);
  } else {
    play.room = Room.newFromJSONObject(play, msg);
    play.emit(Event.OnCreatedRoom);
    play.emit(Event.OnJoinedRoom);
  }
}

// 加入房间
function handleJoinedRoom(play, msg) {
  if (msg.reasonCode) {
    play.emit(Event.OnJoinRoomFailed, msg.reasonCode, msg.detail);
  } else {
    play.room = Room.newFromJSONObject(play, msg);
    play.emit(Event.OnJoinedRoom);
  }
}

// 有新玩家加入房间
function handleNewPlayerJoinedRoom(play, msg) {
  const newPlayer = Player.newFromJSONObject(play, msg.member);
  play.room.addPlayer(newPlayer);
  play.emit(Event.OnNewPlayerJoinedRoom, newPlayer);
}

// 有玩家离开房间
function handlePlayerLeftRoom(play, msg) {
  const actorId = msg.initByActor;
  const leftPlayer = play.room.getPlayer(actorId);
  play.room.removePlayer(actorId);
  play.emit(Event.OnPlayerLeftRoom, leftPlayer);
}

// 主机切换
function handleMasterChanged(play, msg) {
  play.room.setMasterId(msg.masterActorId);
  const newMaster = play.room.getPlayer(msg.masterActorId);
  play.emit(Event.OnMasterSwitched, newMaster);
}

// 房间开启 / 关闭
function handleRoomOpenedChanged(play, msg) {
  const opened = msg.toggle;
  play.room.setOpened(opened);
}

// 房间是否可见
function handleRoomVisibleChanged(play, msg) {
  const visible = msg.toggle;
  play.room.setVisible(visible);
}

// 房间属性变更
function handleRoomCustomPropertiesChanged(play, msg) {
  const changedProperties = msg.attr;
  play.room.mergeProperties(changedProperties);
  play.emit(Event.OnRoomCustomPropertiesChanged, changedProperties);
}

// 玩家属性变更
function handlePlayerCustomPropertiesChanged(play, msg) {
  const player = play.room.getPlayer(msg.initByActor);
  player.mergeProperties(msg.attr);
  play.emit(Event.OnPlayerCustomPropertiesChanged, player, msg.attr);
}

// 玩家下线
function handlePlayerOffline(play, msg) {
  const player = play.room.getPlayer(msg.initByActor);
  player.setActive(false);
  play.emit(Event.OnPlayerActivityChanged, player);
}

// 玩家上线
function handlePlayerOnline(play, msg) {
  const player = play.room.getPlayer(msg.member.actorId);
  player.initWithJSONObject(msg.member);
  player.setActive(true);
  play.emit(Event.OnPlayerActivityChanged, player);
}

// 离开房间
/* eslint no-param-reassign: ["error", { "props": false }] */
function handleLeaveRoom(play) {
  // 清理工作
  play.room = null;
  play.player = null;
  play.emit(Event.OnLeftRoom);
  play.connectToMaster();
}

// 自定义事件
function handleEvent(play, msg) {
  const { eventId: evtId, msg: param, fromActorId: senderId } = msg;
  play.emit(Event.OnEvent, evtId, param, senderId);
}

export default function handleGameMsg(play, message) {
  const msg = JSON.parse(message.data);
  console.warn(`${play.userId} Game msg: ${msg.op} <- ${message.data}`);
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
          console.warn(`no handler for game msg: ${msg.op}`);
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
