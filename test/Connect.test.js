import Event from '../src/Event';
import newPlay from './Utils';

const { expect } = require('chai');
const debug = require('debug')('ConnectTest');

describe('test connection', () => {
  it('test connect', done => {
    const play = newPlay('hello0');
    play.on(Event.CONNECTED, () => {
      debug('OnConnected');
    });
    play.on(Event.CONNECT_FAILED, error => {
      debug(`OnConnectFailed: ${error}`);
    });
    play.on(Event.JOINED_LOBBY, () => {
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test connect with same id', done => {
    const play1 = newPlay('hello1');
    const play2 = newPlay('hello1');
    play1.on(Event.CONNECTED, () => {
      play2.connect();
    });
    play2.on(Event.CONNECTED, () => {
      debug('play2 connected');
    });
    play2.on(Event.ERROR, error => {
      debug(`error code: ${error.code}`);
      if (error.code === 4104) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });
    play1.connect();
  });

  it('test disconnect from master', done => {
    const play = newPlay('hello2');
    play.on(Event.JOINED_LOBBY, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.disconnect();
    });
    play.on(Event.DISCONNECTED, () => {
      done();
    });
    play.connect();
  });

  it('test disconnect from game', done => {
    const play = newPlay('hello3');
    const roomName = 'roomname';
    play.on(Event.JOINED_LOBBY, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom({ roomName });
    });
    play.on(Event.CREATED_ROOM, () => {
      expect(play._room.name).to.be.equal(roomName);
      play.disconnect();
    });
    play.on(Event.DISCONNECTED, () => {
      done();
    });
    play.connect();
  });

  it('test connect failed', done => {
    let connectCount = 0;
    const play = newPlay('hello4');
    play.on(Event.CONNECTED, () => {});
    play.on(Event.CONNECT_FAILED, () => {
      connectCount += 1;
      if (connectCount >= 5) {
        done();
      } else {
        play.connect();
      }
    });
    play.connect();
  });
});
