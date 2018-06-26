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

describe('test join room', function() {
  it('test join name room', function(done) {
    var roomName = '211';
    var play1 = newPlay('hello');
    var play2 = newPlay('world');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
    play2.connect();
  });

  it('test join random room', function(done) {
    var roomName = '212';
    var play1 = newPlay('hello2');
    var play2 = newPlay('world2');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.connect();
      }, 2000);
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
      play2.joinRandomRoom();
    });
    play2.on(Event.OnJoinedRoom, function() {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  it('test join with expected userIds', function(done) {
    var roomName = '213';
    var play1 = newPlay('hello3');
    var play2 = newPlay('world3');
    var play3 = newPlay('code');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      var options = new RoomOptions();
      options.maxPlayerCount = 3;
      play1.createRoom(roomName, options, ['world3', 'code']);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      play3.joinRoom(roomName);
    });

    play3.on(Event.OnJoinedLobby, function() {
      expect(play3._sessionToken).to.be.not.empty;
    });
    play3.on(Event.OnJoinedRoom, function() {
      expect(play3.room.name).to.be.equal(roomName);
      play1.disconnect();
      play2.disconnect();
      play3.disconnect();
      done();
    });

    play1.connect();
    play2.connect();
    play3.connect();
  });

  it('test leave room', function(done) {
    var roomName = '214';
    var play1 = newPlay('hello4');
    var play2 = newPlay('world4');
    var joinCount = 0;

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedLobby, function() {
      if (joinCount === 2) {
        play1.disconnect();
        play2.disconnect();
        done();
      } else {
        joinCount++;
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.leaveRoom();
      }, 1000);
    });
    play2.on(Event.OnLeftRoom, function() {
      console.log('OnLeftRoom: ');
    });

    play1.connect();
  });

  it('test rejoin room', function(done) {
    var roomName = '235';
    var play1 = newPlay('hello5');
    var play2 = newPlay('world5');
    var rejoin = false;

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      var options = new RoomOptions();
      options.playerTtl = 600;
      play1.createRoom(roomName, options);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedLobby, function() {
      if (rejoin) {
        play2.rejoinRoom(roomName);
      } else {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      if (rejoin) {
        play1.disconnect();
        play2.disconnect();
        done();
        return;
      }
      setTimeout(() => {
        play2.disconnect();
      }, 1000);
    });
    play2.on(Event.OnDisconnected, function() {
      if (!rejoin) {
        rejoin = true;
        play2.connect();
      }
    });
    play2.on(Event.OnLeftRoom, function() {
      console.log('OnLeftRoom: ');
    });

    play1.connect();
  });

  it('test reconnectAndRejoin room', function(done) {
    var roomName = '216';
    var play1 = newPlay('hello6');
    var play2 = newPlay('world6');
    var reconnect = false;

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      var options = new RoomOptions();
      options.playerTtl = 600;
      play1.createRoom(roomName, options);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinedLobby, function() {
      if (!reconnect) {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.OnJoinedRoom, function() {
      expect(play2.room.name).to.be.equal(roomName);
      if (reconnect) {
        play1.disconnect();
        play2.disconnect();
        done();
        return;
      }
      setTimeout(() => {
        play2.disconnect();
      }, 1000);
    });
    play2.on(Event.OnDisconnected, function() {
      if (!reconnect) {
        reconnect = true;
        play2.reconnectAndRejoin();
      }
    });
    play2.on(Event.OnLeftRoom, function() {
      console.log('OnLeftRoom');
    });

    play1.connect();
  });

  it('test join name room failed', function(done) {
    var roomName = '218';
    var roomName2 = '219';
    var play1 = newPlay('hello8');
    var play2 = newPlay('world8');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName2);
    });

    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
    });
    play2.on(Event.OnJoinRoomFailed, function() {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
    play2.connect();
  });

  it('test join random room with match properties', function(done) {
    var roomName = '220';
    var play1 = newPlay('hello0');
    var play2 = newPlay('world0');
    var play3 = newPlay('play0');

    play1.on(Event.OnJoinedLobby, function() {
      expect(play1._sessionToken).to.be.not.empty;
      var options = new RoomOptions();
      var matchProps = {
        lv: 2,
      };
      options.customRoomProperties = matchProps;
      options.customRoomPropertiesForLobby = ['lv'];
      play1.createRoom(roomName, options);
    });
    play1.on(Event.OnCreatedRoom, function() {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.connect();
      }, 2000);
    });

    // play2 加入成功
    play2.on(Event.OnJoinedLobby, function() {
      expect(play2._sessionToken).to.be.not.empty;
      var matchProps = {
        lv: 2,
      };
      play2.joinRandomRoom(matchProps);
    });
    play2.on(Event.OnJoinedRoom, function() {
      play3.connect();
    });

    // play3 加入失败
    play3.on(Event.OnJoinedLobby, function() {
      expect(play3._sessionToken).to.be.not.empty;
      var matchProps = {
        lv: 3,
      };
      play3.joinRandomRoom(matchProps);
    });
    play3.on(Event.OnJoinRoomFailed, function(code, detail) {
      play1.disconnect();
      play2.disconnect();
      play3.disconnect();
      done();
    });

    play1.connect();
  });
});
