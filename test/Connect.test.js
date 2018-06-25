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

describe('test connection', function () {
    it('test connect with same id', function (done) {
        var play1 = newPlay('hello');
        var play2 = newPlay('hello2');
        play1.on(Event.OnConnected, function () {
            play2.connect();
        });
        play2.on(Event.OnConnected, function () {
            console.log('play2 connected');
        });
        play2.on(Event.OnDisconnected, function () {
            done();
        });
        play1.connect();
    });

    // it('test disconnect from master', function (done) {
    //     var play = newPlay('hello1');
    //     play.on(Event.OnJoinedLobby, function () {
    //         expect(play._sessionToken).to.be.not.empty;
    //         expect(play._masterServer).to.be.not.empty;
    //         play.disconnect();
    //     });
    //     play.on(Event.OnDisconnected, function () {
    //         done();
    //     });
    //     play.connect();
    // });

    // it('test disconnect from game', function (done) {
    //     var play = newPlay('hello2');
    //     var roomName = 'roomname';
    //     play.on(Event.OnJoinedLobby, function () {
    //         expect(play._sessionToken).to.be.not.empty;
    //         expect(play._masterServer).to.be.not.empty;
    //         play.createRoom(roomName);
    //     });
    //     play.on(Event.OnCreatedRoom, function () {
    //         expect(play.room.name).to.be.equal(roomName);
    //         play.disconnect();
    //     });
    //     play.on(Event.OnDisconnected, function () {
    //         done();
    //     });
    //     play.connect();
    // });
});