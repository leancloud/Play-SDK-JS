import { newPlay } from './Utils';

describe('test router', () => {
  it('test app router', async () => {
    const p = newPlay('tar0');
    await p.connect();
    await p.disconnect();
  });
});
