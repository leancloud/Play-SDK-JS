import { play, Event } from '../src/index';

import { APP_ID, APP_KEY, APP_REGION } from './Config';

const { expect } = require('chai');
const debug = require('debug')('Test:CreateRoom');

describe('test global play', () => {
  it('test global play', done => {
    play.init({
      appId: APP_ID,
      appKey: APP_KEY,
      region: APP_REGION,
    });
    let i = 0;
    const timer = setInterval(() => {
      play.userId = 'haha';
      play.on(Event.Error, err => {
        const { code, detail } = err;
        debug(`Play: (${code}) ${detail}`);
      });
      play.on(Event.CONNECTED, () => {
        play.joinOrCreateRoom('deathmatch');
      });
      play.on(Event.ROOM_JOINED, () => {
        play.reset();
        i += 1;
        if (i === 5) {
          clearInterval(timer);
          done();
        }
        debug('---------------------------------------------------------');
      });
      play.on(Event.CONNECT_FAILED, error => {
        debug(`Play: Failed to connect: (${error.code}) ${error.detail}`);
      });
      play.on(Event.ROOM_JOIN_FAILED, error => {
        debug(`Play: Failed to join room: (${error.code}) ${error.detail}`);
      });
      play.on(Event.ROOM_CREATE_FAILED, error => {
        debug(`Play: Failed to create room: (${error.code}) ${error.detail}`);
      });
      play.connect();
    }, 5000);
  });
});
