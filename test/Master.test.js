import Event from '../src/Event';
import newPlay from './Utils';

const { expect } = require('chai');
const debug = require('debug')('MasterTest');

describe('test master', () => {
  it('test set new master', done => {
    const roomName = '611';
    const play1 = newPlay('hello1');
    const play2 = newPlay('world1');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.LOBBY_JOINED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ROOM_JOINED, newPlayer => {
      play1.setMaster(newPlayer.actorId);
    });
    play1.on(Event.MASTER_SWITCHED, newMaster => {
      expect(play1.room.masterId).to.be.equal(newMaster.actorId);
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.LOBBY_JOINED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
    });
    play2.on(Event.MASTER_SWITCHED, newMaster => {
      expect(play2.room.masterId).to.be.equal(newMaster.actorId);
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
  });

  it('test master leave', done => {
    const roomName = '622';
    const play1 = newPlay('hello2');
    const play2 = newPlay('world2');
    let newConnect = false;

    play1.on(Event.LOBBY_JOINED, () => {
      if (newConnect) {
        return;
      }
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ROOM_JOINED, () => {
      play1.leaveRoom();
    });
    play1.on(Event.ROOM_LEFT, () => {
      newConnect = true;
    });

    play2.on(Event.LOBBY_JOINED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
    });
    play2.on(Event.PLAYER_ROOM_LEFT, leftPlayer => {
      debug(`${leftPlayer.userId} left room`);
      expect(leftPlayer.actorId).to.be.equal(1);
    });
    play2.on(Event.MASTER_SWITCHED, newMaster => {
      expect(play2.room.masterId).to.be.equal(newMaster.actorId);
      setTimeout(() => {
        play1.disconnect();
        play2.disconnect();
        done();
      }, 2000);
    });

    play1.connect();
  });
});
