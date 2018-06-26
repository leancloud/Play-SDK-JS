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

describe('test custom event', function() {
  it('test custom event with ReceiverGroup', function(done) {
    var roomName = '511';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.OnEvent, function(eventId, param, senderId) {
      expect(eventId).to.be.equal('hi');
      expect(param.name).to.be.equal('aaaa');
      expect(param.body).to.be.equal('bbbb');
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
      play2.joinRoom(roomName);
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      var options = new SendEventOptions();
      options.receiverGroup = ReceiverGroup.MasterClient;
      var eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      play2.sendEvent('hi', eventData, options);
    });
    play2.on(Event.OnEvent, function(eventId, eventData, senderId) {
      expect(eventId).to.be.equal('hi');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
    });

    play1.connect();
  });

  it('test custom event with target ids', function(done) {
    var roomName = '515';
    var play1 = newPlay('hello2');
    var play2 = newPlay('world2');
    var p1Flag = false;
    var p2Flag = false;

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });
    play1.on(Event.OnEvent, function(eventId, eventData, senderId) {
      expect(eventId).to.be.equal('hello');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      var options = new SendEventOptions();
      options.targetActorIds = [1, 2];
      var eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      play2.sendEvent('hello', eventData, options);
    });
    play2.on(Event.OnEvent, function(eventId, eventData, senderId) {
      expect(eventId).to.be.equal('hello');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
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
