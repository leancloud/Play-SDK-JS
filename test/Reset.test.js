import { newPlay } from './Utils';

const debug = require('debug')('Test:close');

describe('test close', () => {
  it('test close', async () => {
    const p = newPlay('tr0_0');
    await p.connect();
    await p.createRoom();
    await p.close();
    await p.connect();
    await p.createRoom();
    await p.close();
  });

  it('test router connecting close', async () => {
    const p = newPlay('tr1_0');
    p.connect();
    await p.close();
    await p.connect();
    await p.close();
  });

  it('test lobby connecting close', async () => {
    const p = newPlay('tr2_0');
    p._fsm.on('transition', async data => {
      debug(`transition: from ${data.fromState} to ${data.toState}`);
      if (data.toState === 'lobby') {
        await p.close();
      }
    });
    await p.connect();
  });

  it('test game connecting close', async () => {
    const p = newPlay('tr3_0');
    await p.connect();
    p.createRoom();
    await p.close();
    await p.connect();
    await p.createRoom();
    await p.close();
  });
});
