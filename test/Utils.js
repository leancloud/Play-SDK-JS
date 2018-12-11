import Play from '../src/Play';
import Region from '../src/Region';
import { APP_ID, APP_KEY, APP_REGION } from './Config';

function newPlay(userId) {
  const play = new Play({
    userId,
    appId: APP_ID,
    appKey: APP_KEY,
    region: APP_REGION,
  });
  return play;
}

function newWechatPlay(userId) {
  const play = new Play({
    userId,
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    region: Region.NorthChina,
    feature: 'wechat',
  });
  return play;
}

export { newPlay, newWechatPlay };
