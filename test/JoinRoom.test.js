import Event from '../src/Event';
import RoomOptions from '../src/RoomOptions';

import newPlay from './Utils';

const { expect } = require('chai');
const debug = require('debug')('JoinRoomTest');

describe('test join room', () => {
  it('test join name room', done => {
    const roomName = '211';
    const play1 = newPlay('hello');
    const play2 = newPlay('world');

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOINED_ROOM, () => {
      expect(play2.room.name).to.be.equal(roomName);
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
    play2.connect();
  });

  it('test join random room', done => {
    const roomName = '212';
    const play1 = newPlay('hello2');
    const play2 = newPlay('world2');

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.connect();
      }, 2000);
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRandomRoom();
    });
    play2.on(Event.JOINED_ROOM, () => {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  it('test join with expected userIds', done => {
    const roomName = '213';
    const play1 = newPlay('hello3');
    const play2 = newPlay('world3');
    const play3 = newPlay('code');

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = new RoomOptions();
      options.maxPlayerCount = 3;
      play1.createRoom(roomName, {
        roomOptions: options,
        expectedUserIds: ['world3', 'code'],
      });
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOINED_ROOM, () => {
      expect(play2.room.name).to.be.equal(roomName);
      play3.joinRoom(roomName);
    });

    play3.on(Event.JOINED_LOBBY, () => {
      expect(play3._sessionToken).to.be.not.equal(null);
    });
    play3.on(Event.JOINED_ROOM, () => {
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

  it('test leave room', done => {
    const roomName = '214';
    const play1 = newPlay('hello4');
    const play2 = newPlay('world4');
    let joinCount = 0;

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOINED_LOBBY, () => {
      if (joinCount === 2) {
        play1.disconnect();
        play2.disconnect();
        done();
      } else {
        joinCount += 1;
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.JOINED_ROOM, () => {
      expect(play2.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.leaveRoom();
      }, 1000);
    });
    play2.on(Event.LEFT_ROOM, () => {
      debug('OnLeftRoom');
    });

    play1.connect();
  });

  it('test rejoin room', done => {
    const roomName = '235';
    const play1 = newPlay('hello5');
    const play2 = newPlay('world5');
    let rejoin = false;

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = new RoomOptions();
      options.playerTtl = 600;
      play1.createRoom(roomName, {
        roomOptions: options,
      });
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ACTIVITY_CHANGED, player => {
      debug(`${player.userId}'s inActivity is ${player.isInActive()}`);
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOINED_LOBBY, () => {
      if (rejoin) {
        play2.rejoinRoom(roomName);
      } else {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.JOINED_ROOM, () => {
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
    play2.on(Event.DISCONNECTED, () => {
      if (!rejoin) {
        rejoin = true;
        play2.connect();
      }
    });
    play2.on(Event.LEFT_ROOM, () => {
      debug('OnLeftRoom:');
    });

    play1.connect();
  });

  it('test reconnectAndRejoin room', done => {
    const roomName = '216';
    const play1 = newPlay('hello6');
    const play2 = newPlay('world6');
    let reconnect = false;

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = new RoomOptions();
      options.playerTtl = 600;
      play1.createRoom(roomName, {
        roomOptions: options,
      });
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOINED_LOBBY, () => {
      if (!reconnect) {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.JOINED_ROOM, () => {
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
    play2.on(Event.DISCONNECTED, () => {
      if (!reconnect) {
        reconnect = true;
        play2.reconnectAndRejoin();
      }
    });
    play2.on(Event.LEFT_ROOM, () => {
      debug('OnLeftRoom');
    });

    play1.connect();
  });

  it('test join name room failed', done => {
    const roomName = '218';
    const roomName2 = '219';
    const play1 = newPlay('hello8');
    const play2 = newPlay('world8');

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName2);
    });

    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.JOIN_ROOM_FAILED, () => {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
    play2.connect();
  });

  it('test join random room with match properties', done => {
    const roomName = '220';
    const play1 = newPlay('hello0');
    const play2 = newPlay('world0');
    const play3 = newPlay('play0');

    play1.on(Event.JOINED_LOBBY, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = new RoomOptions();
      const matchProps = {
        lv: 2,
      };
      options.customRoomProperties = matchProps;
      options.customRoomPropertiesKeysForLobby = ['lv'];
      play1.createRoom(roomName, {
        roomOptions: options,
      });
    });
    play1.on(Event.CREATED_ROOM, () => {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        play2.connect();
      }, 2000);
    });

    // play2 加入成功
    play2.on(Event.JOINED_LOBBY, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      const matchProps = {
        lv: 2,
      };
      play2.joinRandomRoom({
        matchProperties: matchProps,
      });
    });
    play2.on(Event.JOINED_ROOM, () => {
      play3.connect();
    });

    // play3 加入失败
    play3.on(Event.JOINED_LOBBY, () => {
      expect(play3._sessionToken).to.be.not.equal(null);
      const matchProps = {
        lv: 3,
      };
      play3.joinRandomRoom({
        matchProperties: matchProps,
      });
    });
    play3.on(Event.JOIN_ROOM_FAILED, () => {
      play1.disconnect();
      play2.disconnect();
      play3.disconnect();
      done();
    });

    play1.connect();
  });
});
