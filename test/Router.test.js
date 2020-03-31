import { newPlay, newUSPlay } from './Utils';
import Client from '../src/Client';

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

  it('test default server', async () => {
    const p = newUSPlay('tar2');
    await p.connect();
    await p.close();
  });

  it('test us', async () => {
    const p = new Client({
      appId: 'yR48IPheWK2by2dfouYtlzTU-MdYXbMMI',
      appKey: 'gw3bfkG2EAuN8e9ft5y9kPMq',
      userId: 'tar3',
      playServer: 'https://yr48iphe.play.lncldglobal.com',
    });
    await p.connect();
    await p.close();
  });

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
});
