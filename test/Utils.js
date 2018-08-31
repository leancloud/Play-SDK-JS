import Play from '../src/Play';
import Region from '../src/Region';
import { APP_ID, APP_KEY } from './Config';

function newPlay(userId) {
  const play = new Play();
  play.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: Region.EastChina,
  });
  play.userId = userId;
  return play;
}

function newNorthChinaPlay(userId) {
  const play = new Play();
  play.init({
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    region: Region.NorthChina,
  });
  play.userId = userId;
  return play;
}

export { newPlay, newNorthChinaPlay };
