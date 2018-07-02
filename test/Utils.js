import { Play, Region } from '../src/Play';
import { APP_ID, APP_KEY } from './Config';

export default function newPlay(userId) {
  const play = new Play();
  play.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: Region.EAST_CN,
  });
  play.userId = userId;
  return play;
}
