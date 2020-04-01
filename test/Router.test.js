import { newPlay } from './Utils';
import Client from '../src/Client';
import { getFallbackRouter } from '../src/AppRouter';

const { expect } = require('chai');
const debug = require('debug')('Test:Codec');

describe('test router', () => {
  it('test play router', async () => {
    const p = newPlay('tar0');
    await p.connect();
    await p.close();
  });

  it('test play server', async () => {
    const p = new Client({
      appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
      appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
      userId: 'tar1',
      playServer: 'https://fqr8l8ll.play.lncldapi.com',
    });
    await p.connect();
    await p.createRoom();
    await p.close();
  });

  it('test no url', async () => {
    // 国内节点
    expect(
      () =>
        new Client({
          appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
          appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
          userId: 'tar1',
        })
    ).to.throw('Please init with your server url.');
    // 国际节点
    const p = new Client({
      appId: 'yR48IPheWK2by2dfouYtlzTU-MdYXbMMI',
      appKey: 'gw3bfkG2EAuN8e9ft5y9kPMq',
      userId: 'tar2',
    });
    await p.connect();
  });

  it('test fallback router', () => {
    debug(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI'));
    expect(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI')).to.be.equal(
      'https://fqr8l8ll.play.lncldglobal.com/1/multiplayer/router/route'
    );
  });
});
