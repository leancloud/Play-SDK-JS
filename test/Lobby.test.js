import Event from '../src/Event';
import { newPlay } from './Utils';
import Play from '../src/Play';
import { APP_ID, APP_KEY, APP_REGION } from './Config';

const { expect } = require('chai');
const debug = require('debug')('Test:Lobby');

describe('test lobby', () => {
  it('test join lobby manually', done => {
    const play = new Play({
      userId: 'play',
      appId: APP_ID,
      appKey: APP_KEY,
      region: APP_REGION,
    });
    play.on(Event.CONNECTED, () => {
      play.joinLobby();
    });
    play.on(Event.LOBBY_JOINED, () => {
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test room list update', done => {
    const play1 = newPlay('play1');
    const play2 = newPlay('play2');
    const play3 = newPlay('play3');
    const play4 = newPlay('play4');
    let roomCount = 0;
    play1.on(Event.CONNECTED, () => {
      const props = {
        title: 'room title',
        level: 2,
      };
      const options = {
        customRoomProperties: props,
        customRoomPropertiesKeysForLobby: ['level'],
      };
      play1.createRoom({
        roomName: play1.userId,
        roomOptions: options,
      });
    });
    play1.on(Event.ROOM_CREATED, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play2.on(Event.CONNECTED, () => {
      play2.createRoom({ roomName: play2.userId });
    });
    play2.on(Event.ROOM_CREATED, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play3.on(Event.CONNECTED, () => {
      play3.createRoom({ roomName: play3.userId });
    });
    play3.on(Event.ROOM_CREATED, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play4.on(Event.CONNECTED, () => {
      play4.joinLobby();
    });
    play4.on(Event.LOBBY_ROOM_LIST_UPDATED, () => {
      if (play4.lobbyRoomList.length > 0) {
        for (let i = 0; i < play4.lobbyRoomList.length; i += 1) {
          const lobbyRoom = play4.lobbyRoomList[i];
          debug(lobbyRoom.customRoomProperties);
        }
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
