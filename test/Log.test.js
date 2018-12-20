import d from 'debug';

import { newPlay } from './Utils';
import { LogLevel, setLogger } from '../src/Logger';

const debug = d('Test:Log');

describe('test log', () => {
  it('test print', async () => {
    setLogger({
      [LogLevel.Debug]: debug,
    });
    const p = newPlay('tl0');
    await p.connect();
    await p.disconnect();
  });
});
