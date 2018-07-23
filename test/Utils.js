import Play from '../src/Play';
import Region from '../src/Region';
import { APP_ID, APP_KEY } from './Config';

export default function newPlay(userId) {
  const play = new Play();
  play.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: Region.EastChina,
  });
  play.userId = userId;
  return play;
}
