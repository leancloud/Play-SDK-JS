import { newPlay } from './Utils';
import Client from '../src/Client';
import { getFallbackRouter } from '../src/AppRouter';
import LobbyService from '../src/LobbyService';
import { LogLevel, setLogger } from '../src/Logger';

const { expect } = require('chai');
const debug = require('debug')('Test:Codec');

describe('test router', () => {
  // it('test play router', async () => {
  //   const p = newPlay('tar0');
  //   await p.connect();
  //   await p.close();
  // });

  // it('test play server', async () => {
  //   const p = new Client({
  //     appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
  //     appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
  //     userId: 'tar1',
  //     playServer: 'https://fqr8l8ll.play.lncldapi.com',
  //   });
  //   await p.connect();
  //   await p.createRoom();
  //   await p.close();
  // });

  // it('test fallback router', done => {
  //   debug(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va'));
  //   expect(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va')).to.be.equal(
  //     'https://fqr8l8ll.play.lncldapi.com/1/multiplayer/router/route'
  //   );
  //   debug(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI'));
  //   expect(getFallbackRouter('FQr8l8LLvdxIwhMHN77sNluX-MdYXbMMI')).to.be.equal(
  //     'https://fqr8l8ll.play.lncldglobal.com/1/multiplayer/router/route'
  //   );
  //   debug(getFallbackRouter('BMYV4RKSTwo8WSqt8q9ezcWF-gzGzoHsz'));
  //   expect(getFallbackRouter('BMYV4RKSTwo8WSqt8q9ezcWF-gzGzoHsz')).to.be.equal(
  //     'https://bmyv4rks.play.lncld.com/1/multiplayer/router/route'
  //   );
  //   done();
  // });

  it('test http lobby', async () => {
    setLogger({
      [LogLevel.Debug]: debug,
      [LogLevel.Error]: debug,
    });
    const roomName = 'leancloud';
    const c1 = new Client({
      appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
      appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
      userId: 'lean',
      playServer: 'https://fqr8l8ll.play.lncldapi.com',
    });
    await c1.connect();
    await c1.joinOrCreateRoom(roomName);
    await c1.close();
    // await c1.createRoom({ roomName });
    // await c1.joinLobby();

    // const c2 = new Client({
    //   appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
    //   appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
    //   userId: 'cloud',
    //   playServer: 'https://fqr8l8ll.play.lncldapi.com',
    // });
    // await c2.connect();
    // await c2.joinRoom(roomName);
  });
});
