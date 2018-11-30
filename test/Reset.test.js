import Event from '../src/Event';
import { newPlay } from './Utils';

describe('test reset', () => {
  it('test reset', done => {
    const play = newPlay('tr0_1');
    let flag = false;
    play.on(Event.CONNECTED, () => {
      play.createRoom();
    });
    play.on(Event.ROOM_JOINED, async () => {
      if (flag) {
        play.disconnect();
        done();
        return;
      }
      await play.reset();
      play.connect();
      flag = true;
    });
    play.connect();
  });
});
