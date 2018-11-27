import { newPlay } from '../Utils';

const debug = require('debug')('Test:JoinRoom');

describe('test join room', () => {
  it('test join room xx', async () => {
    const roomName = 'jr1_r1';
    const p0 = newPlay('jr1_0');
    const p1 = newPlay('jr1_1');
    await p0.connect();
    await p0.createRoom({
      roomName,
    });
    debug('create room done');
    await p1.connect();
    await p1.joinRoom(roomName);
    debug('join room done');
    await p0.disconnect();
    debug('p0 disconnected');
    await p1.disconnect();
    debug('p1 disconnected');
  });

  it('test join or create room', async () => {
    const roomName = 'jr2_r1';
    const p0 = newPlay('jr2_0');
    const p1 = newPlay('jr2_1');
    await p0.connect();
    await p0.joinOrCreateRoom(roomName);
    await p1.connect();
    await p1.joinOrCreateRoom(roomName);
    await p0.disconnect();
    await p1.disconnect();
  });

  it('test join random room', async () => {
    const roomName = 'jr3_r1';
    const p0 = newPlay('jr3_0');
    const p1 = newPlay('jr3_1');
    await p0.connect();
    await p0.createRoom(roomName);
    await p1.connect();
    await p1.joinRandomRoom();
    await p0.disconnect();
    await p1.disconnect();
  });
});
