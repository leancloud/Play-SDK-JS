import d from 'debug';

import Event from '../src/Event';
import { newPlay } from './Utils';
import { LogLevel, setLogger } from '../src/Logger';

const debug = d('Test:Log');

describe('test log', () => {
  it('test print', done => {
    setLogger({
      [LogLevel.Debug]: debug,
    });
    const play = newPlay('tl0');
    play.on(Event.CONNECTED, () => {
      play.disconnect();
      done();
    });
    play.connect();
  });
});
