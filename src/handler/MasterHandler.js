'use strict';

import { Room } from '../Room';
import { Player } from '../Player';
import { MasterRoom } from '../MasterRoom';
import { handleErrorMsg } from './ErrorHandler';
import { Event } from '../Event';

// 大厅消息处理
function handleMasterMsg(play, message) {
    var msg = JSON.parse(message.data);
    console.log(play.userId + " Lobby msg: " + msg.op + " <- " + message.data);
    switch (msg.cmd) {
        case "session": {
            switch (msg.op) {
                case "opened":
                    handleMasterServerSessionOpen(play, msg);
                break;
                default:
                    console.error("no handler for lobby msg: " + msg.op);
                break;
            }
        }
        break;
        case "conv": {
            switch (msg.op) {
                case "results":
                    handleRoomList(play, msg);
                break;
                case "started":
                    handleCreateGameServer(play, msg);
                break;
                case "added":
                    handleJoinGameServer(play, msg);
                break;
                case 'random-added':
                    handleJoinGameServer(play, msg);
                break;
                default:
                    console.error("no handler for lobby msg: " + msg.op);
                break;
            }
        }
        break;
        case "events":
            // TODO

        break;
        case "error": {
            handleErrorMsg(play, msg);
        }
        break;
        default:
            if (msg.cmd) {
                console.error("no handler for lobby msg: " + msg.cmd);
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
    play.emit(Event.OnJoinedLobby);
}

// 房间列表更新
function handleRoomList(play, msg) {
    play.masterRoomList = [];
    for (var i = 0; i < msg.rooms.length; i++) {
        var masterRoomDTO = msg.rooms[i];
        play.masterRoomList[i] = new MasterRoom(masterRoomDTO);
    }
}

// 创建房间
function handleCreateGameServer(play, msg) {
    if (msg.reasonCode) {
        var code = msg.reasonCode;
        var detail = msg.detail;
        play.emit(Event.OnCreateRoomFailed, code, detail);
    } else {
        play._cachedRoomMsg.op = "start";
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
        play._cachedRoomMsg.op = "add";
        handleGameServer(play, msg);
    }
}

function handleGameServer(play, msg) {
    play._gameAddr = msg.addr;
    play._secureGameAddr = msg.secureAddr;
    if (msg.cid)
        play._cachedRoomMsg.cid = msg.cid;
    play.connectToGame();
}

export { handleMasterMsg }