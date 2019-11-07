import Client from '../src/Client';

function newPlay(userId) {
  const play = new Client({
    appId: 'FQr8l8LLvdxIwhMHN77sNluX-9Nh9j0Va',
    appKey: 'MJSm46Uu6LjF5eNmqfbuUmt6',
    userId,
    playServer: 'https://fqr8l8ll.play.lncldapi.com',
  });
  return play;
}

function newWechatPlay(userId) {
  const play = new Client({
    appId: 'vwDice44bmatVulkQvErSg5C-gzGzoHsz',
    appKey: 'caOtXw8Lm1jFmPjdtkPSM0mC',
    userId,
    feature: 'wechat',
  });
  return play;
}

export { newPlay, newWechatPlay };
