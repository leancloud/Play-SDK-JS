import Event from '../src/Event';
import { newQCloudPlay } from './Utils';

const debug = require('debug')('Test:KickPlayer');

describe('test kick player', () => {
  it('test kick player', done => {
    const roomName = 'kp_1_r';
    const p1 = newQCloudPlay('kp_1_1');
    const p2 = newQCloudPlay('kp_1_2');
    let f1 = false;
    let f2 = false;

    p1.on(Event.CONNECTED, () => {
      p1.createRoom({ roomName });
    });
    p1.on(Event.ROOM_CREATED, () => {
      p2.connect();
    });
    p1.on(Event.PLAYER_ROOM_LEFT, () => {
      f1 = true;
      if (f1 && f2) {
        p1.disconnect();
        p2.disconnect();
        done();
      }
    });

    p2.on(Event.CONNECTED, () => {
      p2.joinRoom(roomName);
    });
    p2.on(Event.ROOM_JOINED, () => {
      p1.kickPlayer(p2.player.actorId, {
        code: 121,
        msg: 'get out',
      });
    });
    p2.on(Event.ROOM_KICKED, data => {
      const { code, msg } = data;
      debug(`kicked: ${code}, ${msg}`);
      f2 = true;
      if (f1 && f2) {
        p1.disconnect();
        p2.disconnect();
        done();
      }
    });

    p1.connect();
  });
});
