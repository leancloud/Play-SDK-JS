import { newPlay } from '../Utils';
import { error } from '../../src/Logger';

const { expect } = require('chai');
const debug = require('debug')('Test:CreateRoom');

describe('test create room', () => {
  it('test create room', async () => {
    const p = newPlay('cr1');
    await p.connect();
    debug('connected');
    await p.createRoom({
      roomName: 'cr1_r1',
    });
    debug('create room done');
    await p.disconnect();
    debug('disconnect');
  });
});
