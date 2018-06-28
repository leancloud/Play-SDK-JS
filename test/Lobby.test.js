import Event from '../src/Event';
import newPlay from './Utils';

const { expect } = require('chai');

describe('test lobby', () => {
  it('test join lobby manually', done => {
    const play = newPlay('play');
    play.on(Event.OnConnected, () => {
      console.warn('lobby test connected');
      play.joinLobby();
    });
    play.on(Event.OnJoinedLobby, () => {
      play.disconnect();
      done();
    });
    play.connect(
      '0.0.1',
      false
    );
  });

  it('test room list update', done => {
    const play1 = newPlay('play1');
    const play2 = newPlay('play2');
    const play3 = newPlay('play3');
    const play4 = newPlay('play4');
    let roomCount = 0;
    play1.on(Event.OnJoinedLobby, () => {
      play1.createRoom(play1.userId);
    });
    play1.on(Event.OnCreatedRoom, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play2.on(Event.OnJoinedLobby, () => {
      play2.createRoom(play2.userId);
    });
    play2.on(Event.OnCreatedRoom, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play3.on(Event.OnJoinedLobby, () => {
      play3.createRoom(play3.userId);
    });
    play3.on(Event.OnCreatedRoom, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play4.on(Event.OnLobbyRoomListUpdate, () => {
      if (play4.lobbyRoomList.length > 0) {
        expect(play4.lobbyRoomList.length >= 3).to.be.equal(true);
        play1.disconnect();
        play2.disconnect();
        play3.disconnect();
        play4.disconnect();
        done();
      }
    });
    play1.connect();
    play2.connect();
    play3.connect();
  });
});
