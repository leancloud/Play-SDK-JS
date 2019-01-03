import Client from '../src/Client';
import { APP_ID, APP_KEY } from './Config';

function newPlay(userId) {
  const play = new Client({
    userId,
    appId: APP_ID,
    appKey: APP_KEY,
  });
  return play;
}

function newWechatPlay(userId) {
  const play = new Client({
    userId,
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    feature: 'wechat',
  });
  return play;
}

export { newPlay, newWechatPlay };
