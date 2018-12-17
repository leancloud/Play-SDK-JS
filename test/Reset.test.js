import { newPlay } from './Utils';

const debug = require('debug')('Test:Reset');

describe('test reset', () => {
  it('test reset', async () => {
    const p = newPlay('tr0_0');
    await p.connect();
    await p.createRoom();
    await p.reset();
    await p.connect();
    await p.createRoom();
    await p.disconnect();
  });

  it('test router connecting reset', async () => {
    const p = newPlay('tr1_0');
    p.connect();
    await p.reset();
    await p.connect();
    await p.disconnect();
  });

  it('test lobby connecting reset', async () => {
    const p = newPlay('tr2_0');
    p._fsm.on('transition', async data => {
      debug(`transition: from ${data.fromState} to ${data.toState}`);
      if (data.toState === 'lobbyConnected') {
        await p.reset();
      }
    });
    await p.connect();
  });

  it('test game connecting reset', async () => {
    const p = newPlay('tr3_0');
    await p.connect();
    p.createRoom();
    await p.reset();
    await p.connect();
    await p.createRoom();
    await p.disconnect();
  });
});
