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
    PlayArray,
} from '../src/index';
import {
    newPlay
} from './Utils';

describe('test change properties', function () {
    it('test change room properties', function (done) {
        var roomName = '311';
        var play1 = newPlay('hello');
        var play2 = newPlay('world');
        var p1Flag = false;
        var p2Flag = false;

        play1.on(Event.OnJoinedLobby, function () {
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.joinRoom(roomName);
        });
        play1.on(Event.OnRoomCustomPropertiesChanged, function (changedProps) {
            var props = play1.room.getCustomProperties();
            expect(props.getString('title')).to.be.equal('room311');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p1Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
            var props = new PlayObject();
            props.putString('title', 'room311');
            props.putNumber('gold', 1000);
            play2.room.setCustomProperties(props);
        });
        play2.on(Event.OnRoomCustomPropertiesChanged, function (changedProps) {
            var props = play2.room.getCustomProperties();
            expect(props.getString('title')).to.be.equal('room311');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p2Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play1.connect();
        play2.connect();
    });

    it('test change room properties with cas', function (done) {
        var roomName = '312';
        var play1 = newPlay('hello');
        var play2 = newPlay('world');
        var p1Flag = false;
        var p2Flag = false;

        play1.on(Event.OnJoinedLobby, function () {
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.joinRoom(roomName);
        });
        play1.on(Event.OnRoomCustomPropertiesChanged, function (changedProps) {
            var props = play1.room.getCustomProperties();
            expect(props.getNumber('id')).to.be.equal(1);
            expect(props.getString('title')).to.be.equal('room312');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p1Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
            var props = new PlayObject();
            props.putNumber('id', 1);
            props.putString('title', 'room312');
            props.putNumber('gold', 1000);
            play2.room.setCustomProperties(props);

            var p = new PlayObject();
            p.putNumber('id', 2);
            p.putNumber('gold', 2000);
            var ep = new PlayObject();
            ep.putNumber('id', 2);
            play2.room.setCustomProperties(p, ep);
        });
        play2.on(Event.OnRoomCustomPropertiesChanged, function (changedProps) {
            var props = play2.room.getCustomProperties();
            expect(props.getNumber('id')).to.be.equal(1);
            expect(props.getString('title')).to.be.equal('room312');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p2Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play1.connect();
        play2.connect();
    });

    it('test change player properties', function (done) {
        var roomName = '311';
        var play1 = newPlay('hello');
        var play2 = newPlay('world');
        var p1Flag = false;
        var p2Flag = false;

        play1.on(Event.OnJoinedLobby, function () {
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.joinRoom(roomName);
        });
        play1.on(Event.OnPlayerCustomPropertiesChanged, function (player, changedProps) {
            var props = player.getCustomProperties();
            expect(props.getString('nickname')).to.be.equal('Li Lei');
            expect(props.getNumber('gold')).to.be.equal(1000);
            var poker = props.getPlayObject('poker');
            expect(poker.getNumber('flower')).to.be.equal(1);
            expect(poker.getNumber('num')).to.be.equal(13);
            var arr = props.getPlayArray('arr');
            expect(arr.getBool(0)).to.be.ok;
            expect(arr.getNumber(1)).to.be.equal(111);
            var poker = arr.getPlayObject(2);
            expect(poker.getNumber('flower')).to.be.equal(1);
            expect(poker.getNumber('num')).to.be.equal(13);
            p1Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
            var props = new PlayObject();
            props.putString('nickname', 'Li Lei');
            props.putNumber('gold', 1000);
            var poker = new PlayObject();
            poker.putNumber('flower', 1);
            poker.putNumber('num', 13);
            props.putPlayObject('poker', poker);
            var arr = new PlayArray();
            arr.addBool(true);
            arr.addNumber(111);
            arr.addPlayObject(poker);
            props.putPlayArray('arr', arr);
            play2.player.setCustomProperties(props);
        });
        play2.on(Event.OnPlayerCustomPropertiesChanged, function (player, changedProps) {
            var props = player.getCustomProperties();
            expect(props.getString('nickname')).to.be.equal('Li Lei');
            expect(props.getNumber('gold')).to.be.equal(1000);
            var poker = props.getPlayObject('poker');
            expect(poker.getNumber('flower')).to.be.equal(1);
            expect(poker.getNumber('num')).to.be.equal(13);
            var arr = props.getPlayArray('arr');
            expect(arr.getBool(0)).to.be.ok;
            expect(arr.getNumber(1)).to.be.equal(111);
            var poker = arr.getPlayObject(2);
            expect(poker.getNumber('flower')).to.be.equal(1);
            expect(poker.getNumber('num')).to.be.equal(13);
            p2Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play1.connect();
        play2.connect();
    });

    it('test change player properties with cas', function (done) {
        var roomName = '316';
        var play1 = newPlay('hello');
        var play2 = newPlay('world');
        var p1Flag = false;
        var p2Flag = false;

        play1.on(Event.OnJoinedLobby, function () {
            expect(play1._sessionToken).to.be.not.empty;
            play1.createRoom(roomName);
        });
        play1.on(Event.OnCreatedRoom, function () {
            expect(play1.room.name).to.be.equal(roomName);
            play2.joinRoom(roomName);
        });
        play1.on(Event.OnPlayerCustomPropertiesChanged, function (player, changedProps) {
            var props = player.getCustomProperties();
            expect(props.getNumber('id')).to.be.equal(1);
            expect(props.getString('nickname')).to.be.equal('Li Lei');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p1Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play2.on(Event.OnJoinedLobby, function () {
            expect(play2._sessionToken).to.be.not.empty;
        });
        play2.on(Event.OnJoinedRoom, function () {
            expect(play2.room.name).to.be.equal(roomName);
            var props = new PlayObject();
            props.putNumber('id', 1);
            props.putString('nickname', 'Li Lei');
            props.putNumber('gold', 1000);
            play2.player.setCustomProperties(props);

            var p = new PlayObject();
            p.putString('nickname', 'Jim');
            var ep = new PlayObject();
            ep.putNumber('id', 0);
            play2.player.setCustomProperties(p, ep);
        });
        play2.on(Event.OnPlayerCustomPropertiesChanged, function (player, changedProps) {
            var props = player.getCustomProperties();
            expect(props.getNumber('id')).to.be.equal(1);
            expect(props.getString('nickname')).to.be.equal('Li Lei');
            expect(props.getNumber('gold')).to.be.equal(1000);
            p2Flag = true;
            if (p1Flag && p2Flag) {
                play1.disconnect();
                play2.disconnect();
                done();
            }
        });

        play1.connect();
        play2.connect();
    });
});