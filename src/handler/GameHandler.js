'use strict';

import { Room } from '../Room';
import { Player } from '../Player';
import { handleErrorMsg } from './ErrorHandler';
import { Event } from '../Event';
import { PlayObject } from '../PlayObject';

function handleGameMsg(play, message) {
    var msg = JSON.parse(message.data);
    console.log(play.userId + " Game msg: " + msg.op + " <- " + message.data);
    switch (msg.cmd) {
        case "session":
            switch (msg.op) {
                case "opened":
                    handleGameServerSessionOpen(play, msg);
                break;
                default:
                    console.error("no handler for op: " + msg.op);
                break;
            }
        break;
        case "conv":
            switch (msg.op) {
                case "started":
                    handleCreatedRoom(play, msg);
                break;
                case "added":
                    handleJoinedRoom(play, msg);
                break;
                case "members-joined":
                    handleNewPlayerJoinedRoom(play, msg);
                break;
                case "members-left":
                    handlePlayerLeftRoom(play, msg);
                break;
                case "master-client-changed":
                    handleMasterChanged(play, msg);
                break;
                case "open":
                    handleRoomOpenedChanged(play, msg);
                break;
                case "visible":
                    handleRoomVisibleChanged(play, msg);
                break;
                case "updated-notify":
                    handleRoomCustomPropertiesChanged(play, msg);
                break;
                case "player-props":
                    handlePlayerCustomPropertiesChanged(play, msg);
                break;
                case "members-offline":
                    handlePlayerOffline(play, msg);
                break;
                case "members-online":
                    handlePlayerOnline(play, msg);
                break;
                case "removed":
                    handleLeaveRoom(play, msg);
                break;
                case "direct":
                    handleEvent(play, msg);
                break;
                default:
                    console.log("no handler for game msg: " + msg.op);
                break;
            }
        break;
        case "direct":
            handleEvent(play, msg);
        break;
        case "ack":
            // ignore
        break;
        case "events":
            // TODO

        break;
        case "error": 
            handleErrorMsg(play, msg);
        break;
        default:
            if (msg.cmd) {
                console.error("no handler for cmd: " + message.data);
            }
        break;
    }
}

// 连接建立后创建 / 加入房间
function handleGameServerSessionOpen(play, msg) {
    // 根据缓存加入房间的规则
    play._cachedRoomMsg.i = play.getMsgId();
    play.send(play._cachedRoomMsg);
}

// 创建房间
function handleCreatedRoom(play, msg) {
    if (msg.reasonCode) {
        var code = msg.reasonCode;
        var detail = msg.detail;
        play.emit(Event.OnCreateRoomFailed, code, detail);
    } else {
        play.room = Room.newFromJSONObject(play, msg);
        play.emit(Event.OnCreatedRoom);
    }
}

// 加入房间
function handleJoinedRoom(play, msg) {
    if (msg.reasonCode) {
        var code = msg.reasonCode;
        var detail = msg.detail;
        play.emit(Event.OnJoinRoomFailed, code, detail);
    } else {
        play.room = Room.newFromJSONObject(play, msg);
        play.emit(Event.OnJoinedRoom);
    }
}

// 有新玩家加入房间
function handleNewPlayerJoinedRoom(play, msg) {
    var newPlayer = Player.newFromJSONObject(play, msg.member);
    play.room.addPlayer(newPlayer);
    play.emit(Event.OnNewPlayerJoinedRoom, newPlayer);
}

// 有玩家离开房间
function handlePlayerLeftRoom(play, msg) {
    var actorId = msg.initByActor;
    var leftPlayer = play.room.getPlayer(actorId);
    play.room.removePlayer(actorId);
    play.emit(Event.OnPlayerLeftRoom, leftPlayer);
}

// 主机切换
function handleMasterChanged(play, msg) {
    var masterActorId = msg.masterActorId;
    play.room.setMasterId(masterActorId);
    var newMaster = play.room.getPlayer(masterActorId);
    play.emit(Event.OnMasterSwitched, newMaster);
}

// 房间开启 / 关闭
function handleRoomOpenedChanged(play, msg) {
    var opened = msg.toggle;
    play.room.setOpened(opened);
}

// 房间是否可见
function handleRoomVisibleChanged(play, msg) {
    var visible = msg.toggle;
    play.room.setVisible(visible);
}

// 房间属性变更
function handleRoomCustomPropertiesChanged(play, msg) {
    var changedProperties = msg.attr;
    play.room.mergeProperties(changedProperties);
    play.emit(Event.OnRoomCustomPropertiesChanged, changedProperties);
}

// 玩家属性变更
function handlePlayerCustomPropertiesChanged(play, msg) {
    var player = play.room.getPlayer(msg.initByActor);
    player.mergeProperties(msg.attr);
    play.emit(Event.OnPlayerCustomPropertiesChanged, player, msg.attr);
}

// 玩家下线
function handlePlayerOffline(play, msg) {
    var player = play.room.getPlayer(msg.initByActor);
    player.setActive(false);
    play.emit(Event.OnPlayerActivityChanged, player);
}

// 玩家上线
function handlePlayerOnline(play, msg) {
    var actorId = msg.member.actorId;
    var player = play.room.getPlayer(actorId);
    player.initWithJSONObject(msg.member);
    player.setActive(true);
    play.emit(Event.OnPlayerActivityChanged, player);
}

// 离开房间
function handleLeaveRoom(play, msg) {
    // 清理工作
    play.room = null;
    play.player = null;
    play.emit(Event.OnLeftRoom);
    play.connectToMaster();
}

// 自定义事件
function handleEvent(play, msg) {
    var senderId = msg.fromActorId;
    var eventId = msg.eventId;
    var params = PlayObject.newFromJSONObject(msg.msg);
    play.emit(Event.OnEvent, eventId, params, senderId);
}

export { handleGameMsg }