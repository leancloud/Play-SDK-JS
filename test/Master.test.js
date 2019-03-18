import Event from '../src/Event';
import CreateRoomFlag from '../src/CreateRoomFlag';
import { newPlay, newQCloudPlay } from './Utils';

const { expect } = require('chai');
const debug = require('debug')('Test:Master');

describe('test master', () => {
  it('test set new master', async () =>
    new Promise(async resolve => {
      const roomName = 'tm0_r';
      const p0 = newQCloudPlay('tm0_0');
      const p1 = newQCloudPlay('tm0_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      const p0Room = await p0.createRoom({ roomName });
      p0.on(Event.MASTER_SWITCHED, async data => {
        const { newMaster } = data;
        expect(p0.room.masterId).to.be.equal(newMaster.actorId);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.MASTER_SWITCHED, async data => {
        const { newMaster } = data;
        expect(p1.room.masterId).to.be.equal(newMaster.actorId);
        f1 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      expect(p0.room.masterId).to.be.equal(p0.player.actorId);
      debug(`before master id: ${p0.room.masterId}`);
      await p0Room.setMaster(p1.player.actorId);
      expect(p0Room.masterId).to.be.equal(p1.player.actorId);
      debug(`after master id: ${p0Room.masterId}`);
    }));

  it('test master leave', () =>
    new Promise(async resolve => {
      const roomName = 'tm1_r';
      const p0 = newPlay('tm1_0');
      const p1 = newPlay('tm1_1');

      await p0.connect();
      await p0.createRoom({ roomName });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.MASTER_SWITCHED, async data => {
        const { newMaster } = data;
        expect(p1.player.actorId).to.be.equal(newMaster.actorId);
        await p0.close();
        await p1.close();
        resolve();
      });
      await p0.leaveRoom();
    }));

  it('test fixed master', () =>
    new Promise(async resolve => {
      const roomName = 'tm2_r';
      const p0 = newPlay('tm2_0');
      const p1 = newPlay('tm2_1');

      await p0.connect();
      await p0.createRoom({
        roomName,
        roomOptions: {
          flag: CreateRoomFlag.FixedMaster,
        },
      });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.PLAYER_ROOM_LEFT, data => {
        const { leftPlayer } = data;
        debug(`${leftPlayer.userId} left room`);
        expect(leftPlayer.actorId).to.be.equal(1);
      });
      p1.on(Event.MASTER_SWITCHED, async data => {
        const { newMaster } = data;
        expect(newMaster).to.be.equal(null);
        expect(p1.room.masterId).to.be.equal(-1);
        expect(p1.room.master).to.be.equal(null);
        await p0.close();
        await p1.close();
        resolve();
      });
      await p0.leaveRoom();
    }));
});
