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

function newNorthChinaPlay(userId) {
  const play = new Client({
    appId: 'g2b0X6OmlNy7e4QqVERbgRJR-gzGzoHsz',
    appKey: 'CM91rNV8cPVHKraoFQaopMVT',
    userId,
    playServer: 'https://g2b0x6om.lc-cn-n1-shared.com',
  });
  return play;
}

function newUSPlay(userId) {
  const play = new Client({
    appId: 'yR48IPheWK2by2dfouYtlzTU-MdYXbMMI',
    appKey: 'gw3bfkG2EAuN8e9ft5y9kPMq',
    userId,
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

export { newPlay, newNorthChinaPlay, newWechatPlay, newUSPlay };
