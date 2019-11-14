import { newPlay, newNorthChinaPlay } from './Utils';
import Event from '../src/Event';
import ReceiverGroup from '../src/ReceiverGroup';
import Client from '../src/Client';

const { expect } = require('chai');
const debug = require('debug')('Test:Connect');

describe('test connect', () => {
  it('test connect', async () => {
    const p = newPlay('tc0');
    await p.connect();
    await p.close();
  });

  it('test disconnect from lobby', async () => {
    let p = newPlay('tc2');
    await p.connect();
    await p.close();
    p = newPlay('tc2');
    await p.connect();
    await p.close();
  });

  it('test disconnect from game', async () => {
    const p = newPlay('tc3');
    await p.connect();
    await p.createRoom();
    await p.close();
  });

  it('test connect failed', async () => {
    const p = newPlay('tc4 ');
    try {
      await p.connect();
    } catch (err) {
      const { code, detail } = err;
      debug(`${code} - ${detail}`);
      expect(code).to.be.equal(4104);
    }
  });

  it('test keep alive', async () => {
    const roomName = 'tc5_r';
    const play = newPlay('tc5');
    await play.connect();
    await play.createRoom(roomName);
    return new Promise(resolve => {
      setTimeout(() => {
        debug('keep alive timeout');
        play.close();
        resolve();
      }, 30000);
    });
  });

  // 暂不支持 wechat 的 protobuf
  // it('test wechat', async () => {
  //   const p = newWechatPlay('tc6');
  //   await p.connect();
  //   await p.close();
  // });

  it('test no ssl', async () => {
    const client = new Client({
      appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
      appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
      userId: 'tc_6',
      playServer: 'https://fqr8l8ll.play.lncldapi.com',
      ssl: false,
    });
    await client.connect();
    const { _lobbyService } = client;
    const { addr } = await _lobbyService.createRoom();
    debug(addr);
    expect(addr.startsWith('ws:')).to.be.equal(true);
  });

  it('test connect repeatedly', done => {
    const p = newPlay('tc_7');
    p.connect()
      .then(async () => {
        await p.close();
        done();
      })
      .catch(console.error);
    p.connect();
  });

  it('test only send', async () => {
    const p = newPlay('tc_8');

    await p.connect();
    await p.createRoom();
    p.on(Event.CUSTOM_EVENT, event => {
      const { eventId } = event;
      debug(`recv: ${eventId}`);
    });
    let timer;
    if (timer) {
      clearInterval(timer);
    }
    timer = setInterval(() => {
      debug('send custom event');
      p.sendEvent(
        123,
        {},
        {
          receiverGroup: ReceiverGroup.Others,
        }
      );
    }, 5000);
    return new Promise(resolve => {
      setTimeout(async () => {
        clearInterval(timer);
        await p.close();
        resolve();
      }, 30000);
    });
  });

  it('test connect return', () => {
    const p = newPlay('tc9');
    p.connect().then(async client => {
      debug(client._userId);
      await p.close();
    });
  });

  it('test north china connect', async () => {
    const p = newNorthChinaPlay('tc10');
    await p.connect();
    await p.close();
  });
});
