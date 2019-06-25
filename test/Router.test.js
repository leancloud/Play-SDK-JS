import { newPlay } from './Utils';
import Client from '../src/Client';

describe('test router', () => {
  it('test play router', async () => {
    const p = newPlay('tar0');
    await p.connect();
    await p.close();
  });

  it('test play server', async () => {
    const p = new Client({
      appId: 'pyon3kvufmleg773ahop2i7zy0tz2rfjx5bh82n7h5jzuwjg',
      appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
      userId: 'tar1',
      playServer: 'https://api2.ziting.wang',
    });
    await p.connect();
    await p.createRoom();
    await p.close();
  });
});
