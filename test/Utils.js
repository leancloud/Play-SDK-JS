import Play from '../src/Play';
import { APP_ID, APP_KEY } from './Config';

export default function newPlay(userId) {
  const play = new Play();
  play.init(APP_ID, APP_KEY);
  play.userId = userId;
  return play;
}
