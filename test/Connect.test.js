var expect = require('chai').expect;
import {
  Play,
  Room,
  Player,
  Event,
  RoomOptions,
  ReceiverGroup,
  SendEventOptions,
} from '../src/index';
import { newPlay } from './Utils';

describe('test connection', function() {
  it('test connect', function(done) {
    var play = newPlay('hello0');
    play.on(Event.OnConnected, function() {
      console.log('OnConnected');
    });
    play.on(Event.OnConnectFailed, function(error) {
      console.log('OnConnectFailed: ' + error);
    });
    play.on(Event.OnJoinedLobby, function() {
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test connect with same id', function(done) {
    var play1 = newPlay('hello');
    var play2 = newPlay('hello');
    play1.on(Event.OnConnected, function() {
      play2.connect();
    });
    play2.on(Event.OnConnected, function() {
      console.log('play2 connected');
    });
    play2.on(Event.OnError, function(code, detail) {
      console.log('error code: ' + code);
      if (code === 4104) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });
    play1.connect();
  });

  it('test disconnect from master', function(done) {
    var play = newPlay('hello1');
    play.on(Event.OnJoinedLobby, function() {
      expect(play._sessionToken).to.be.not.empty;
      expect(play._masterServer).to.be.not.empty;
      play.disconnect();
    });
    play.on(Event.OnDisconnected, function() {
      done();
    });
    play.connect();
  });

  it('test disconnect from game', function(done) {
    var play = newPlay('hello2');
    var roomName = 'roomname';
    play.on(Event.OnJoinedLobby, function() {
      expect(play._sessionToken).to.be.not.empty;
      expect(play._masterServer).to.be.not.empty;
      play.createRoom(roomName);
    });
    play.on(Event.OnCreatedRoom, function() {
      expect(play.room.name).to.be.equal(roomName);
      play.disconnect();
    });
    play.on(Event.OnDisconnected, function() {
      done();
    });
    play.connect();
  });
});
