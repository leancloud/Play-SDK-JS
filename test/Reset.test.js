import { newPlay } from './Utils';
// import { debug } from '../src/Logger';

describe('test close', () => {
  it('test close', async () => {
    let p = newPlay('tr0_0');
    await p.connect();
    await p.createRoom();
    await p.close();
    p = newPlay('tr0_0');
    await p.connect();
    await p.createRoom();
    await p.close();
  });

  it('test router connecting close', async () => {
    let p = newPlay('tr1_0');
    p.connect();
    await p.close();
    p = newPlay('tr1_0');
    await p.connect();
    await p.close();
  });

  // it('test game connecting close', async () => {
  //   let p = newPlay('tr3_0');
  //   await p.connect();
  //   try {
  //     p.createRoom();
  //     await p.close();
  //   } catch (e) {
  //     debug(JSON.stringify(e));
  //   }
  //   p = newPlay('tr3_1');
  //   await p.connect();
  //   await p.createRoom();
  //   await p.close();
  // });
});
