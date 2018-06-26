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

describe('test change properties', function() {
  it('test change room properties', function(done) {
    var roomName = '311';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');
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
    play1.on(Event.OnRoomCustomPropertiesChanged, function(changedProps) {
      var props = play1.room.getCustomProperties();
      expect(props.title).to.be.equal('room311');
      expect(props.gold).to.be.equal(1000);
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
      var props = {
        title: 'room311',
        gold: 1000,
      };
      play2.room.setCustomProperties(props);
    });
    play2.on(Event.OnRoomCustomPropertiesChanged, function(changedProps) {
      var props = play2.room.getCustomProperties();
      expect(props.title).to.be.equal('room311');
      expect(props.gold).to.be.equal(1000);
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

  it('test change room properties with cas', function(done) {
    var roomName = '312';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');
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
    play1.on(Event.OnRoomCustomPropertiesChanged, function(changedProps) {
      var props = play1.room.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.title).to.be.equal('room312');
      expect(props.gold).to.be.equal(1000);
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
      var props = {
        id: 1,
        title: 'room312',
        gold: 1000,
      };
      play2.room.setCustomProperties(props);

      var p = {
        id: 2,
        gold: 2000,
      };
      var ep = {
        id: 2,
      };
      play2.room.setCustomProperties(p, ep);
    });
    play2.on(Event.OnRoomCustomPropertiesChanged, function(changedProps) {
      var props = play2.room.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.title).to.be.equal('room312');
      expect(props.gold).to.be.equal(1000);
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

  it('test change player properties', function(done) {
    var roomName = '311';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');
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
    play1.on(Event.OnPlayerCustomPropertiesChanged, function(
      player,
      changedProps
    ) {
      var props = player.getCustomProperties();
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
      var poker = props.poker;
      expect(poker.flower).to.be.equal(1);
      expect(poker.num).to.be.equal(13);
      var arr = props.arr;
      expect(arr[0]).to.be.ok;
      expect(arr[1]).to.be.equal(111);
      var poker = arr[2];
      expect(poker.flower).to.be.equal(1);
      expect(poker.num).to.be.equal(13);
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
      var props = {
        nickname: 'Li Lei',
        gold: 1000,
      };
      var poker = {
        flower: 1,
        num: 13,
      };
      props.poker = poker;
      var arr = [true, 111, poker];
      props.arr = arr;
      play2.player.setCustomProperties(props);
    });
    play2.on(Event.OnPlayerCustomPropertiesChanged, function(
      player,
      changedProps
    ) {
      var props = player.getCustomProperties();
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
      var poker = props.poker;
      expect(poker.flower).to.be.equal(1);
      expect(poker.num).to.be.equal(13);
      var arr = props.arr;
      expect(arr[0]).to.be.ok;
      expect(arr[1]).to.be.equal(111);
      var poker = arr[2];
      expect(poker.flower).to.be.equal(1);
      expect(poker.num).to.be.equal(13);
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

  it('test change player properties with cas', function(done) {
    var roomName = '316';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');
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
    play1.on(Event.OnPlayerCustomPropertiesChanged, function(
      player,
      changedProps
    ) {
      var props = player.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
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
      var props = {
        id: 1,
        nickname: 'Li Lei',
        gold: 1000,
      };
      play2.player.setCustomProperties(props);

      var p = {
        nickname: 'Jim',
      };
      var ep = {
        id: 0,
      };
      play2.player.setCustomProperties(p, ep);
    });
    play2.on(Event.OnPlayerCustomPropertiesChanged, function(
      player,
      changedProps
    ) {
      var props = player.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
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
