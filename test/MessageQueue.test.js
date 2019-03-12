import { newPlay } from './Utils';
import Event from '../src/Event';

const debug = require('debug')('Test:MessageQueue');

describe('test message queue', () => {
  it('test message queue', async done => {
    const roomName = 'mq0_r1';
    const p0 = newPlay('mq0_0');
    const p1 = newPlay('mq0_1');
    await p0.connect();
    debug('p0 connected');
    await p0.createRoom({
      roomName,
    });
    p0.on(Event.PLAYER_ROOM_JOINED, newPlayer => {
      debug(`${newPlayer.userId} joined room`);
    });
    p0.pause();
    await p1.connect();
    await p1.joinRoom(roomName);
    setTimeout(async () => {
      p0.resume();
      await p0.close();
      await p1.close();
      done();
    }, 5000);
  });
});
