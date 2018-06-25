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

describe('test create room', function () {
    it('test create simple room', function (done) {
        var roomName = '110';
        var play = newPlay('hello1');
        play.on(Event.OnJoinedLobby, function () {
            expect(play._sessionToken).to.be.not.empty;
            expect(play._masterServer).to.be.not.empty;
            play.createRoom(roomName);
        });
        play.on(Event.OnCreatedRoom, function () {
            expect(play.room.name).to.be.equal(roomName);
            play.disconnect();
            done();
        });
        play.connect();
    });

    it('test create custom room', function (done) {
        var roomName = '111';
        var play = newPlay('hello2');
        play.on(Event.OnJoinedLobby, function () {
            expect(play._sessionToken).to.be.not.empty;
            expect(play._masterServer).to.be.not.empty;
            var options = new RoomOptions();
            options.visible = false;
            options.emptyRoomTtl = 10000;
            options.maxPlayerCount = 2;
            options.playerTtl = 600;
            var props = new PlayObject();
            props.putString('title', 'room title');
            props.putNumber('level', 2);
            options.customRoomProperties = props;
            options.customRoomPropertiesForLobby = ['level'];
            var expectedUserIds = ['world'];
            play.joinOrCreateRoom(roomName, options, expectedUserIds);
        });
        play.on(Event.OnCreatedRoom, function () {
            expect(play.room.name).to.be.equal(roomName);
            expect(play.room.visible).to.be.not.ok;
            expect(play.room.maxPlayerCount).to.be.equal(2);
            var props = play.room.getCustomProperties();
            expect(props.getString('title')).to.be.equal('room title');
            expect(props.getNumber('level')).to.be.equal(2);
            expect(play.room.expectedUserIds).to.be.deep.equal(['world']);
            play.disconnect();
            done();
        });
        play.connect();
    });

    it('test create room failed', function (done) {
        var roomName = '115';
        var play1 = newPlay('hello3');
        play1.on(Event.OnJoinedLobby, function () {
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.connect();
        });

        var play2 = newPlay('world3');
        play2.on(Event.OnJoinedLobby, function () {
            play2.createRoom(roomName);
        });
        play2.on(Event.OnCreateRoomFailed, function (code, detail) {
            play1.disconnect();
            play2.disconnect();
            done();
        });

        play1.connect();
    });
});