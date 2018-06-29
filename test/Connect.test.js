import Event from '../src/Event';
import newPlay from './Utils';

const { expect } = require('chai');

describe('test connection', () => {
  it('test connect', done => {
    const play = newPlay('hello0');
    play.on(Event.OnConnected, () => {
      console.warn('OnConnected');
    });
    play.on(Event.OnConnectFailed, error => {
      console.warn(`OnConnectFailed: ${error}`);
    });
    play.on(Event.OnJoinedLobby, () => {
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test connect with same id', done => {
    const play1 = newPlay('hello');
    const play2 = newPlay('hello');
    play1.on(Event.OnConnected, () => {
      play2.connect();
    });
    play2.on(Event.OnConnected, () => {
      console.warn('play2 connected');
    });
    play2.on(Event.OnError, code => {
      console.warn(`error code: ${code}`);
      if (code === 4104) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });
    play1.connect();
  });

  it('test disconnect from master', done => {
    const play = newPlay('hello1');
    play.on(Event.OnJoinedLobby, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.disconnect();
    });
    play.on(Event.OnDisconnected, () => {
      done();
    });
    play.connect();
  });

  it('test disconnect from game', done => {
    const play = newPlay('hello2');
    const roomName = 'roomname';
    play.on(Event.OnJoinedLobby, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom(roomName);
    });
    play.on(Event.OnCreatedRoom, () => {
      expect(play._room.name).to.be.equal(roomName);
      play.disconnect();
    });
    play.on(Event.OnDisconnected, () => {
      done();
    });
    play.connect();
  });
});
