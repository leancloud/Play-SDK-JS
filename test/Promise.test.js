import Event from '../src/Event';
import { newPlay, newWechatPlay } from './Utils';
import { APP_ID, APP_KEY, APP_REGION } from './Config';
import Play from '../src/Play';
import ReceiverGroup from '../src/ReceiverGroup';
import { error } from '../src/Logger';

const { expect } = require('chai');
const debug = require('debug')('Test:Connect');

describe('test promise', () => {
  // it('test connect', async () => {
  //   const p = newPlay('pt0');
  //   await p.connect();
  //   await p.disconnect();
  // })

  // it('test create room', async () => {
  //   try {
  //     const p = newPlay('pt2');
  //     await p.connect();
  //     debug('connected');
  //     await p.createRoom({
  //       roomName: 'pt2_r1'
  //     });
  //     debug('create room done');
  //     await p.disconnect();
  //     debug('disconnect');
  //   } catch (err) {
  //     error(err);
  //   }
  // })

  it('test join room', async () => {
    try {
      const roomName = 'pt3_r1';
      const p0 = newPlay('pt3_0');
      const p1 = newPlay('pt3_1');
      await p0.connect();
      await p0.createRoom({
        roomName,
      });
      debug('create room done');
      await p1.connect();
      await p1.joinRoom(roomName);
      debug('join room done');
      await p0.disconnect();
      await p1.disconnect();
    } catch (err) {
      error(err);
    }
  });
});
