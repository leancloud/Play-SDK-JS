import Client from '../src/Client';
import Region from '../src/Region';
import { APP_ID, APP_KEY, APP_REGION } from './Config';

function newPlay(userId) {
  const play = new Client({
    userId,
    appId: APP_ID,
    appKey: APP_KEY,
    region: APP_REGION,
  });
  return play;
}

function newWechatPlay(userId) {
  const play = new Client({
    userId,
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    region: Region.NorthChina,
    feature: 'wechat',
  });
  return play;
}

function newQCloudPlay(userId) {
  return new Client({
    appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
    appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
    region: Region.EastChina,
    userId,
  });
}

export { newPlay, newWechatPlay, newQCloudPlay };
