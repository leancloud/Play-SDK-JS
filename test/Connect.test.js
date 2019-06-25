import _ from 'lodash';
import { newPlay, newWechatPlay } from './Utils';
import Event from '../src/Event';
import { APP_ID } from './Config';
import ReceiverGroup from '../src/ReceiverGroup';
import LobbyRouter from '../src/LobbyRouter';
import PlayRouter from '../src/PlayRouter';

const { expect } = require('chai');
const debug = require('debug')('Test:Connect');

describe('test connect', () => {
  it('test connect', async () => {
    const p = newPlay('tc0');
    await p.connect();
    await p.close();
  });

  // it('test connect with same id', async () => {
  //   const p0 = newPlay('tc1_0');
  //   const p1 = newPlay('tc1_0');
  //   let f0 = false;
  //   let f1 = false;
  //   await p0.connect();
  //   p0.on(Event.ERROR, async ({ code, detail }) => {
  //     debug(`${code}, ${detail}`);
  //     if (code === 4102) {
  //       f0 = true;
  //       if (f0 && f1) {
  //         await p1.close();
  //       }
  //     }
  //   });
  //   await p1.connect();
  //   f1 = true;
  //   if (f0 && f1) {
  //     await p1.close();
  //   }
  // });

  // it('test disconnect from lobby', async () => {
  //   let p = newPlay('tc2');
  //   await p.connect();
  //   await p.close();
  //   p = newPlay('tc2');
  //   await p.connect();
  //   await p.close();
  // });

  // it('test disconnect from game', async () => {
  //   const p = newPlay('tc3');
  //   await p.connect();
  //   await p.createRoom();
  //   await p.close();
  // });

  // it('test connect failed', async () => {
  //   const p = newPlay('tc4 ');
  //   try {
  //     await p.connect();
  //   } catch (err) {
  //     const { code, detail } = err;
  //     debug(`${code} - ${detail}`);
  //     expect(code).to.be.equal(4104);
  //   }
  // });

  // it('test keep alive', async () => {
  //   const roomName = 'tc5_r';
  //   const play = newPlay('tc5');
  //   await play.connect();
  //   await play.createRoom(roomName);
  //   return new Promise(resolve => {
  //     setTimeout(() => {
  //       debug('keep alive timeout');
  //       play.close();
  //       resolve();
  //     }, 30000);
  //   });
  // });

  // it('test wechat', async () => {
  //   const p = newWechatPlay('tc6');
  //   await p.connect();
  //   await p.close();
  // });

  // it('test ws', async () => {
  //   const playRouter = new PlayRouter(APP_ID);
  //   const router = new LobbyRouter({
  //     appId: APP_ID,
  //     insecure: true,
  //   });
  //   const lobbyRouterUrl = await playRouter.fetch();
  //   const serverInfo = await router.fetch(lobbyRouterUrl);
  //   const { primaryServer, secondaryServer } = serverInfo;
  //   expect(_.startsWith(primaryServer, 'ws:')).to.be.equal(true);
  //   expect(_.startsWith(secondaryServer, 'ws:')).to.be.equal(true);
  // });

  // it('test connect repeatedly', done => {
  //   const p = newPlay('tc_7');
  //   p.connect()
  //     .then(async () => {
  //       await p.close();
  //       done();
  //     })
  //     .catch(console.error);
  //   p.connect();
  // });

  // it('test only send', async () => {
  //   const p = newPlay('tc_8');
  //   let timer = null;
  //   await p.connect();
  //   await p.createRoom();
  //   p.on(Event.CUSTOM_EVENT, event => {
  //     const { eventId } = event;
  //     debug(`recv: ${eventId}`);
  //   });
  //   timer = setInterval(() => {
  //     debug('send custom event');
  //     p.sendEvent(
  //       123,
  //       {},
  //       {
  //         receiverGroup: ReceiverGroup.Others,
  //       }
  //     );
  //   }, 5000);
  //   return new Promise(resolve => {
  //     setTimeout(async () => {
  //       clearInterval(timer);
  //       await p.close();
  //       resolve();
  //     }, 30000);
  //   });
  // });

  // it('test connect return', () => {
  //   const p = newPlay('tc9');
  //   p.connect().then(async client => {
  //     debug(client._userId);
  //     await p.close();
  //   });
  // });
});
