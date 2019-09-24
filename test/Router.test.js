import { newPlay } from './Utils';
import Client from '../src/Client';
import { getFallbackRouter } from '../src/PlayRouter';
import LobbyClient from '../src/LobbyClient';
import { LogLevel, setLogger } from '../src/Logger';

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

  it('test fallback router', done => {
    debug(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va'));
    expect(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va')).to.be.equal(
      'https://fqr8l8ll.play.lncldapi.com/1/multiplayer/router/route'
    );
    debug(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI'));
    expect(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI')).to.be.equal(
      'https://fqr8l8ll.play.lncldglobal.com/1/multiplayer/router/route'
    );
    debug(getFallbackRouter('BMYV4RKSTwo8WSqt8q9ezcWF-gzGzoHsz'));
    expect(getFallbackRouter('BMYV4RKSTwo8WSqt8q9ezcWF-gzGzoHsz')).to.be.equal(
      'https://bmyv4rks.play.lncld.com/1/multiplayer/router/route'
    );
    done();
  });

  it('test http lobby', async () => {
    setLogger({
      [LogLevel.Debug]: debug,
      [LogLevel.Error]: debug,
    });
    const client = new LobbyClient({
      appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
      appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
      userId: 'tar1',
      server: 'https://fqr8l8ll.lc-cn-e1-shared.com',
    });
    await client.authorize();
    await client.createRoom('leancloud');
  });
});
