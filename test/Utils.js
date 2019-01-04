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

function newQCloudPlay(userId) {
  return new Client({
    appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
    appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
    userId,
  });
}

export { newPlay, newWechatPlay, newQCloudPlay };
