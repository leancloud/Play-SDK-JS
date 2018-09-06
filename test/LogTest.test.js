import Event from '../src/Event';
import { newPlay } from './Utils';
import { LogLevel, setLogDelegate } from '../src/Logger';

import d from 'debug';

const debug = d('Play:TestLog');

describe('test log', () => {
  it('test print', done => {
    setLogDelegate((logLevel, log) => {
      switch (logLevel) {
        case LogLevel.Debug:
          debug(log);
          break;
        case LogLevel.Warn:
          console.warn(log);
          break;
        case LogLevel.Error:
          console.error(log);
          break;
        default:
          break;
      }
    });
    const play = newPlay('tl0');
    play.on(Event.CONNECTED, () => {
      play.disconnect();
      done();
    });
    play.connect();
  });
});
