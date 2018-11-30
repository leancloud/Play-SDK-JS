import { newPlay } from '../Utils';

const debug = require('debug')('Test:Reset');

describe('test reset', () => {
  it('test reset', async () => {
    const p = newPlay('tr0_1');
    await p.connect();
    await p.createRoom();
    await p.reset();
    debug('reset done');
    await p.connect();
    await p.createRoom();
    await p.disconnect();
  });
});
