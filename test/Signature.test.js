import Play from '../src/Play';
import Region from '../src/Region';
import Event from '../src/Event';
import initPlayWithAVUserSign from '../src/plugins/AVSignUtils';

const debug = require('debug')('Test:Signature');

describe('test signature', () => {
  it('test AVUser signature', done => {
    const fakeAVUser = {
      objectId: '5bbc68c902612d001ab28bfa',
      getSessionToken: () => '3ldgk2s4ihabhi569hr9h5ssn',
    };
    const play = new Play();
    initPlayWithAVUserSign({
      play,
      avUser: fakeAVUser,
      appId: '2ke9qjLSGeamYyU7dT6eqvng-9Nh9j0Va',
      appKey: 'FEttS9MjIXgmyvbslSp90aUI',
      region: Region.EastChina,
    });
    play.on(Event.CONNECTED, () => {
      debug('OnConnected');
      play.disconnect();
      done();
    });
    play.on(Event.CONNECT_FAILED, error => {
      debug(`OnConnectFailed: ${JSON.stringify(error)}`);
    });
    play.connect();
  });
});
