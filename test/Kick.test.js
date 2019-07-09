import Event from '../src/Event';
import { newPlay } from './Utils';

const { expect } = require('chai');
const debug = require('debug')('Test:Kick');

describe('test kick', () => {
  it('test kick with no msg', () =>
    new Promise(async resolve => {
      const roomName = 'tk0_r';
      const p0 = newPlay('tk0_0');
      const p1 = newPlay('tk0_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      const p0Room = await p0.createRoom({ roomName });

      p0.on(Event.PLAYER_ROOM_JOINED, async ({ newPlayer }) => {
        expect(p0.room.playerList.length).to.be.equal(2);
        await p0Room.kickPlayer(newPlayer.actorId);
        expect(p0.room.playerList.length).to.be.equal(1);
        f0 = true;
        if (f0 && f1) {
          debug('f0 close');
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      await p1.connect();
      await p1.joinRoom(roomName);

      p1.on(Event.ROOM_KICKED, async () => {
        f1 = true;
        if (f0 && f1) {
          debug('f1 close');
          await p0.close();
          await p1.close();
          resolve();
        }
      });
    }));

  it('test kick with msg', () =>
    new Promise(async resolve => {
      const roomName = 'tk1_r';
      const p0 = newPlay('tk1_0');
      const p1 = newPlay('tk1_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      const p0Room = await p0.createRoom({ roomName });
      await p1.connect();
      await p1.joinRoom(roomName);

      p1.on(Event.ROOM_KICKED, async data => {
        const { code, msg } = data;
        debug(`kicked: ${code}, ${msg}`);
        expect(code).to.be.equal(404);
        f1 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      await p0Room.kickPlayer(p1.player.actorId, {
        code: 404,
        msg: 'You cheat!',
      });
      f0 = true;
      if (f0 && f1) {
        await p0.close();
        await p1.close();
        resolve();
      }
    }));
});
