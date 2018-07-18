import Play from '../src/Play';
import Region from '../src/Region';
import PlayOptions from '../src/PlayOptions';
import { APP_ID, APP_KEY } from './Config';

export default function newPlay(userId) {
  const opts = new PlayOptions();
  opts.appId = APP_ID;
  opts.appKey = APP_KEY;
  opts.region = Region.EastChina;
  const play = new Play();
  play.init(opts);
  play.userId = userId;
  return play;
}
