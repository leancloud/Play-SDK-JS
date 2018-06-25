var expect = require('chai').expect;
import {
    Play, 
    Room, 
    Player, 
    Event, 
    RoomOptions, 
    ReceiverGroup, 
    SendEventOptions,
    PlayObject,
} from '../src/index';
import {
    newPlay
} from './Utils';

describe('test master', function () {
    it('test set new master', function (done) {
        var roomName = '611';
        var play1 = newPlay('hello1');
        var play2 = newPlay('world1');
        var newMasterId = -1;
        var p1Flag = false;
        var p2Flag = false;

        play1.on(Event.OnJoinedLobby, function () {
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.connect();
        });
        play1.on(Event.OnNewPlayerJoinedRoom, function (newPlayer) {
            newMasterId = newPlayer.actorId;
            play1.setMaster(newPlayer.actorId);
        });
        play1.on(Event.OnMasterSwitched, function (newMaster) {
            expect(play1.room.masterActorId).to.be.equal(newMasterId);
            p1Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
            play2.joinRoom(roomName);
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
        });
        play2.on(Event.OnMasterSwitched, function (newMaster) {
            expect(play2.room.masterActorId).to.be.equal(newMasterId);
            p2Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play1.connect();
    });

    it('test master leave', function (done) {
        var roomName = '622';
        var play1 = newPlay('hello2');
        var play2 = newPlay('world2');
        var newMasterId = -1;
        var newConnect = false;

        play1.on(Event.OnJoinedLobby, function () {
            if (newConnect) {
                return;
            }
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.connect();
        });
        play1.on(Event.OnNewPlayerJoinedRoom, function (newPlayer) {
            newMasterId = newPlayer.actorId;
            play1.leaveRoom();
        });
        play1.on(Event.OnLeftRoom, function () {
            newConnect = true;
        });
        
        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
            play2.joinRoom(roomName);
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
        });
        play2.on(Event.OnMasterSwitched, function (newMaster) {
            expect(play2.room.masterActorId).to.be.equal(newMasterId);
            setTimeout(() => {
                play1.disconnect();
                play2.disconnect();
                done();
            }, 2000);
        });

        play1.connect();
    });
});