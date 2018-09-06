import Event from '../src/Event';
// import CreateRoomFlag from '../src/CreateRoomFlag';
import { newPlay } from './Utils';

const { expect } = require('chai');
const debug = require('debug')('MasterTest');

describe('test master', () => {
  it('test set new master', done => {
    const roomName = 'tm1';
    const play1 = newPlay('tm1_1');
    const play2 = newPlay('tm1_2');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.CONNECTED, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ROOM_JOINED, data => {
      const { newPlayer } = data;
      play1.setMaster(newPlayer.actorId);
    });
    play1.on(Event.MASTER_SWITCHED, data => {
      const { newMaster } = data;
      expect(play1.room.masterId).to.be.equal(newMaster.actorId);
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.CONNECTED, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
    });
    play2.on(Event.MASTER_SWITCHED, data => {
      const { newMaster } = data;
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
    const roomName = 'tm2';
    const play1 = newPlay('tm2_1');
    const play2 = newPlay('tm2_2');
    let newConnect = false;

    play1.on(Event.CONNECTED, () => {
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

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
    });
    play2.on(Event.PLAYER_ROOM_LEFT, data => {
      const { leftPlayer } = data;
      debug(`${leftPlayer.userId} left room`);
      expect(leftPlayer.actorId).to.be.equal(1);
    });
    play2.on(Event.MASTER_SWITCHED, data => {
      const { newMaster } = data;
      expect(play2.room.masterId).to.be.equal(newMaster.actorId);
      setTimeout(() => {
        play1.disconnect();
        play2.disconnect();
        done();
      }, 2000);
    });

    play1.connect();
  });

  // it('test set master failed', (done) => {
  //   const roomName = '613';
  //   const play1 = newPlay('hello3');
  //   const play2 = newPlay('world4');
  //   let p1Flag = false;
  //   let p2Flag = false;

  //   play1.on(Event.CONNECTED, () => {
  //     expect(play1._sessionToken).to.be.not.equal(null);
  //     play1.createRoom({ roomName,
  //      roomOptions: {
  //       flag: CreateRoomFlag.MasterSetMaster
  //      }
  //     });
  //   });
  //   play1.on(Event.ROOM_CREATED, () => {
  //     expect(play1.room.name).to.be.equal(roomName);
  //     play2.connect();
  //   });
  //   play1.on(Event.MASTER_SWITCHED, (data) => {
  //     const { newMaster } = data;
  //     expect(play1.room.masterId).to.be.equal(newMaster.actorId);
  //     p1Flag = true;
  //     if (p1Flag && p2Flag) {
  //       play1.disconnect();
  //       play2.disconnect();
  //       done();
  //     }
  //   });

  //   play2.on(Event.CONNECTED, () => {
  //     expect(play2._sessionToken).to.be.not.equal(null);
  //     play2.joinRoom(roomName);
  //   });
  //   play2.on(Event.ROOM_JOINED, () => {
  //     expect(play2.room.name).to.be.equal(roomName);
  //     play2.setMaster(play2.player.actorId);
  //   });
  //   play2.on(Event.MASTER_SWITCHED, (data) => {
  //     const { newMaster } = data;
  //     expect(play2.room.masterId).to.be.equal(newMaster.actorId);
  //     p2Flag = true;
  //     if (p1Flag && p2Flag) {
  //       play1.disconnect();
  //       play2.disconnect();
  //       done();
  //     }
  //   });

  //   play1.connect();
  // });
});
