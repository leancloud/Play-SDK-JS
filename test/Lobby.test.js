import Event from '../src/Event';
import newPlay from './Utils';
import Play from '../src/Play';
import Region from '../src/Region';
import PlayOptions from '../src/PlayOptions';
import RoomOptions from '../src/RoomOptions';
import { APP_ID, APP_KEY } from './Config';

const { expect } = require('chai');
const debug = require('debug')('LobbyTest');

describe('test lobby', () => {
  it('test join lobby manually', done => {
    const opts = new PlayOptions();
    opts.appId = APP_ID;
    opts.appKey = APP_KEY;
    opts.region = Region.EAST_CN;
    opts.autoJoinLobby = false;
    const play = new Play();
    play.init(opts);
    play.userId = 'play';
    play.on(Event.CONNECTED, () => {
      play.joinLobby();
    });
    play.on(Event.JOINED_LOBBY, () => {
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
    play1.on(Event.JOINED_LOBBY, () => {
      const options = new RoomOptions();
      const props = {
        title: 'room title',
        level: 2,
      };
      options.customRoomProperties = props;
      options.customRoomPropertiesKeysForLobby = ['level'];
      play1.createRoom({
        roomName: play1.userId,
        roomOptions: options,
      });
    });
    play1.on(Event.CREATED_ROOM, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play2.on(Event.JOINED_LOBBY, () => {
      play2.createRoom({ roomName: play2.userId });
    });
    play2.on(Event.CREATED_ROOM, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play3.on(Event.JOINED_LOBBY, () => {
      play3.createRoom({ roomName: play3.userId });
    });
    play3.on(Event.CREATED_ROOM, () => {
      roomCount += 1;
      if (roomCount === 3) {
        play4.connect();
      }
    });
    play4.on(Event.LOBBY_ROOM_LIST_UPDATE, () => {
      if (play4.lobbyRoomList.length > 0) {
        for (let i = 0; i < play4.lobbyRoomList.length; i += 1) {
          const lobbyRoom = play4.lobbyRoomList[i];
          debug(lobbyRoom.customRoomPropertiesForLobby);
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
