import { newPlay } from '../Utils';

const { expect } = require('chai');
const debug = require('debug')('Test:Connect');

describe('test connect', () => {
  it('test connect', async () => {
    const p = newPlay('tc0');
    await p.connect();
    await p.disconnect();
  });

  it('test keep alive', async () => {
    const roomName = 'tc1_r';
    const play = newPlay('tc1');
    await play.connect();
    await play.createRoom(roomName);
    return new Promise(resolve => {
      setTimeout(() => {
        debug('keep alive timeout');
        play.disconnect();
        resolve();
      }, 30000);
    });
  });
});
