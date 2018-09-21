import AVUserSignatureFactory from '../src/plugins/AVUserSignatureFactory';

const debug = require('debug')('Test:Signature');

describe('test signature', () => {
  it('test AVUser signature', done => {
    const fakeAVUser = {
      getSessionToken: () => 'tldi7txfc5fpgbjed9xh032tx',
    };
    AVUserSignatureFactory.init({
      appId: '1yzaPvxYPs2DLQXIccBzb0k1-gzGzoHsz',
      appKey: 'Nlt1SIVxxFrMPut6SvfEJiYT',
      avUser: fakeAVUser,
    });
    AVUserSignatureFactory.loginSignature()
      .then(sign => {
        debug(sign);
        done();
      })
      .catch(err => {
        debug(err);
      });
  });
});
