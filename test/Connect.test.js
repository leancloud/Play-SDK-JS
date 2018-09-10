import Event from '../src/Event';
import { newPlay, newNorthChinaPlay } from './Utils';

const { expect } = require('chai');
const debug = require('debug')('Test:Connect');

describe('test connection', () => {
  it('test connect', done => {
    const play = newPlay('tc0');
    play.on(Event.CONNECTED, () => {
      debug('OnConnected');
      play.disconnect();
      done();
    });
    play.on(Event.CONNECT_FAILED, error => {
      debug(`OnConnectFailed: ${error}`);
    });
    play.connect();
  });

  it('test connect with same id', done => {
    const play1 = newPlay('tc1');
    const play2 = newPlay('tc1');
    play1.on(Event.CONNECTED, () => {
      play2.connect();
    });
    play2.on(Event.CONNECTED, () => {
      debug('play2 connected');
    });
    play2.on(Event.ERROR, error => {
      debug(`error code: ${error.code}`);
      if (error.code === 4102) {
        play1.disconnect();
        // play2.disconnect();
        done();
      }
    });
    play1.connect();
  });

  it('test disconnect from master', done => {
    const play = newPlay('tc2');
    let reconnectFlag = false;
    play.on(Event.CONNECTED, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.disconnect();
      if (reconnectFlag) {
        done();
      }
    });
    play.on(Event.DISCONNECTED, () => {
      if (!reconnectFlag) {
        play.reconnect();
        reconnectFlag = true;
      }
    });
    play.connect();
  });

  it('test disconnect from game', done => {
    const play = newPlay('tc3');
    const roomName = 'roomname';
    play.on(Event.CONNECTED, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom({ roomName });
    });
    play.on(Event.ROOM_CREATED, () => {
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
    const play = newPlay('tc4');
    play.on(Event.CONNECTED, () => {
      play.disconnect();
      done();
    });
    play.on(Event.CONNECT_FAILED, () => {
      connectCount += 1;
      if (connectCount >= 5) {
        play.disconnect();
        done();
      } else {
        play.connect();
      }
    });
    play.connect();
  });

  it('test keep alive', done => {
    const roomName = 'tc5_room';
    const play = newPlay('tc5');
    play.on(Event.CONNECTED, () => {
      play.createRoom(roomName);
    });
    play.on(Event.ROOM_JOINED, () => {
      debug('joined');
    });

    setTimeout(() => {
      play.disconnect();
      done();
    }, 30000);

    play.connect();
  });

  it('test wechat', done => {
    const play = newNorthChinaPlay('ct6');
    play.feature = 'wechat';
    play.on(Event.CONNECTED, () => {
      debug('OnConnected');
      play.disconnect();
      done();
    });
    play.on(Event.CONNECT_FAILED, error => {
      debug(`OnConnectFailed: ${error}`);
    });
    play.connect();
  });
});
