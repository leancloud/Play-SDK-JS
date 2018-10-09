import Play from '../src/Play';
import Region from '../src/Region';
import { APP_ID, APP_KEY, APP_REGION } from './Config';

function newPlay(userId) {
  const play = new Play();
  play.init({
    appId: APP_ID,
    appKey: APP_KEY,
    region: APP_REGION,
  });
  play.userId = userId;
  return play;
}

function newWechatPlay(userId) {
  const play = new Play();
  play.init({
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    region: Region.NorthChina,
    feature: 'wechat',
  });
  play.userId = userId;
  return play;
}

function newQCloudPlay(userId) {
  const play = new Play();
  play.init({
    appId: '2ke9qjLSGeamYyU7dT6eqvng-9Nh9j0Va',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    region: Region.EastChina,
  });
  play.userId = userId;
  return play;
}

export { newPlay, newWechatPlay, newQCloudPlay };
