import Event from '../src/Event';

import { newPlay } from './Utils';

const { expect } = require('chai');
const debug = require('debug')('Test:JoinRoom');

describe('test join room', () => {
  it('test join name room', done => {
    const roomName = '211';
    const play1 = newPlay('hello');
    const play2 = newPlay('world');

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  it('test join random room', done => {
    const roomName = '212';
    const play1 = newPlay('hello2');
    const play2 = newPlay('world2');

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        debug('random timeout');
        play2.connect();
      }, 2000);
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRandomRoom();
    });
    play2.on(Event.ROOM_JOINED, () => {
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

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = {
        maxPlayerCount: 2,
      };
      play1.createRoom({
        roomName,
        roomOptions: options,
        expectedUserIds: ['code'],
      });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOIN_FAILED, () => {
      play3.connect();
    });

    play3.on(Event.CONNECTED, () => {
      expect(play3._sessionToken).to.be.not.equal(null);
      play3.joinRoom(roomName);
    });
    play3.on(Event.ROOM_JOINED, () => {
      expect(play3.room.name).to.be.equal(roomName);
      play1.disconnect();
      play2.disconnect();
      play3.disconnect();
      done();
    });

    play1.connect();
  });

  it('test leave room', done => {
    const roomName = '214';
    const play1 = newPlay('hello4');
    const play2 = newPlay('world4');
    let flag = false;

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
      debug('CONNECTED');
    });
    play2.on(Event.DISCONNECTED, () => {
      debug('play2 disconnected');
    });
    play2.on(Event.ROOM_JOINED, () => {
      play2.leaveRoom();
    });
    play2.on(Event.ROOM_LEFT, () => {
      debug('OnLeftRoom');
      if (flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      } else {
        play2.joinRoom(roomName);
        flag = true;
      }
    });

    play1.connect();
  });

  it('test rejoin room', done => {
    const roomName = '235';
    const play1 = newPlay('hello5');
    const play2 = newPlay('world5');
    let rejoin = false;

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = {
        playerTtl: 600,
      };
      play1.createRoom({
        roomName,
        roomOptions: options,
      });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ACTIVITY_CHANGED, data => {
      const { player } = data;
      debug(`${player.userId}'s activity is ${player.isActive()}`);
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.CONNECTED, () => {
      if (rejoin) {
        play2.rejoinRoom(roomName);
      } else {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      if (rejoin) {
        play1.disconnect();
        play2.disconnect();
        done();
        return;
      }
      setTimeout(() => {
        debug('rejoin timeout');
        play2.disconnect();
      }, 1000);
    });
    play2.on(Event.DISCONNECTED, () => {
      debug('play2 disconnected');
      if (!rejoin) {
        rejoin = true;
        play2.connect();
      }
    });
    play2.on(Event.ROOM_LEFT, () => {
      debug('OnLeftRoom:');
    });

    play1.connect();
  });

  it('test reconnectAndRejoin room', done => {
    const roomName = '216';
    const play1 = newPlay('hello6');
    const play2 = newPlay('world6');
    let reconnect = false;

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      const options = {
        playerTtl: 600,
      };
      play1.createRoom({
        roomName,
        roomOptions: options,
      });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      if (!reconnect) {
        play2.joinRoom(roomName);
      }
    });
    play2.on(Event.ROOM_JOINED, () => {
      debug('play2 room joined');
      expect(play2.room.name).to.be.equal(roomName);
      if (reconnect) {
        play1.disconnect();
        play2.disconnect();
        done();
      } else {
        play2.disconnect();
      }
    });
    play2.on(Event.DISCONNECTED, () => {
      debug('play2 disconnected');
      if (!reconnect) {
        reconnect = true;
        play2.reconnectAndRejoin();
      }
    });
    play2.on(Event.ROOM_LEFT, () => {
      debug('on left room');
    });

    play1.connect();
  });

  it('test join name room failed', done => {
    const roomName = '218';
    const roomName2 = '219';
    const play1 = newPlay('hello8');
    const play2 = newPlay('world8');

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName2);
    });
    play2.on(Event.ROOM_JOIN_FAILED, () => {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  it('test join random room with match properties', done => {
    const roomName = '220';
    const play1 = newPlay('hello0');
    const play2 = newPlay('world0');
    const play3 = newPlay('play0');

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);

      const matchProps = {
        lv: 2,
      };
      const options = {
        customRoomProperties: matchProps,
        customRoomPropertyKeysForLobby: ['lv'],
      };
      play1.createRoom({
        roomName,
        roomOptions: options,
      });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      setTimeout(() => {
        debug('random with props timeout');
        play2.connect();
      }, 2000);
    });

    // play2 加入成功
    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      const matchProps = {
        lv: 2,
      };
      play2.joinRandomRoom({
        matchProperties: matchProps,
      });
    });
    play2.on(Event.ROOM_JOINED, () => {
      play3.connect();
    });

    // play3 加入失败
    play3.on(Event.CONNECTED, () => {
      expect(play3._sessionToken).to.be.not.equal(null);
      const matchProps = {
        lv: 3,
      };
      play3.joinRandomRoom({
        matchProperties: matchProps,
      });
    });
    play3.on(Event.ROOM_JOIN_FAILED, () => {
      play1.disconnect();
      play2.disconnect();
      play3.disconnect();
      done();
    });

    play1.connect();
  });

  it('test join room concurrently', done => {
    const roomName = 'tjr_room8';
    const p1 = newPlay('p1');
    const p2 = newPlay('p2');
    const p3 = newPlay('p3');
    let f2 = false;
    let f3 = false;

    p1.on(Event.CONNECTED, () => {
      p1.createRoom({ roomName });
    });
    p1.on(Event.ROOM_JOINED, () => {
      p2.connect();
      p3.connect();
    });

    p2.on(Event.CONNECTED, () => {
      p2.joinRoom(roomName);
    });
    p2.on(Event.ROOM_JOINED, () => {
      debug('p2 joined');
      f2 = true;
      if (f2 && f3) {
        p1.disconnect();
        p2.disconnect();
        p3.disconnect();
        done();
      }
    });
    p2.on(Event.PLAYER_ROOM_JOINED, data => {
      const { newPlayer } = data;
      debug(`new player ${newPlayer.userId} joined`);
    });

    p3.on(Event.CONNECTED, () => {
      p3.joinRoom(roomName);
    });
    p3.on(Event.ROOM_JOINED, () => {
      debug('p3 joined');
      f3 = true;
      if (f2 && f3) {
        p1.disconnect();
        p2.disconnect();
        p3.disconnect();
        done();
      }
    });
    p3.on(Event.PLAYER_ROOM_JOINED, data => {
      const { newPlayer } = data;
      debug(`new player ${newPlayer.userId} joined`);
    });

    p1.connect();
  });
});
