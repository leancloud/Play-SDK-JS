const { expect } = require('chai');
const debug = require('debug')('Test:Codec');
const messages = require('../src/proto/messages_pb');

describe('test codec', () => {
  it('test protobuf', async () => {
    const sessionOpen = new messages.SessionOpenRequest();
    sessionOpen.setAppid('123xxx');
    sessionOpen.setPeerid('leancloud');
    sessionOpen.setSdkversion('v0.18.0');
    sessionOpen.setGameversion('1.0');
    debug(sessionOpen.toObject());
  });
});
