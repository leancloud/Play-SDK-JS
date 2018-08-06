import Event from '../src/Event';
import newPlay from './Utils';

const { expect } = require('chai');
const debug = require('debug')('CreateRoomTest');

describe('test create room', () => {
  it('test null room name', done => {
    const play = newPlay('hello');
    play.on(Event.CONNECTED, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom();
    });
    play.on(Event.ROOM_CREATED, () => {
      debug(play.room.name);
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test create simple room', done => {
    const roomName = '110';
    const play = newPlay('hello1');
    play.on(Event.CONNECTED, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom({ roomName });
    });
    play.on(Event.ROOM_CREATED, () => {
      expect(play.room.name).to.be.equal(roomName);
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test create custom room', done => {
    const randId = parseInt(Math.random() * 1000000, 10);
    const roomName = `id${randId}`;
    const play = newPlay('hello2');
    play.on(Event.CONNECTED, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);

      const props = {
        title: 'room title',
        level: 2,
      };
      const options = {
        visible: false,
        emptyRoomTtl: 10000,
        maxPlayerCount: 2,
        playerTtl: 600,
        customRoomProperties: props,
        customRoomPropertiesKeysForLobby: ['level'],
      };
      const expectedUserIds = ['world'];
      play.joinOrCreateRoom(roomName, {
        roomOptions: options,
        expectedUserIds,
      });
    });
    play.on(Event.ROOM_CREATED, () => {
      expect(play.room.name).to.be.equal(roomName);
      expect(play.room.visible).to.be.equal(false);
      expect(play.room.maxPlayerCount).to.be.equal(2);
      const props = play.room.getCustomProperties();
      expect(props.title).to.be.equal('room title');
      expect(props.level).to.be.equal(2);
      expect(play.room.expectedUserIds).to.be.deep.equal(['world']);
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test create room failed', done => {
    const roomName = '115';
    const play1 = newPlay('hello3');
    const play2 = newPlay('world3');
    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      play2.createRoom({ roomName });
    });
    play2.on(Event.ROOM_CREATE_FAILED, () => {
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  it('test isMaster or isLocal', done => {
    const roomName = '116';
    const play1 = newPlay('hello6');
    const play2 = newPlay('world6');

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.LOBBY_LEFT, () => {
      debug('play1 left lobby');
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_ROOM_JOINED, data => {
      const { newPlayer } = data;
      expect(play1.player.isMaster()).to.be.equal(true);
      expect(newPlayer.isMaster()).to.be.equal(false);
      expect(play1.player.isLocal()).to.be.equal(true);
      expect(newPlayer.isLocal()).to.be.equal(false);
      expect(play1.room.playerList.length).to.be.equal(2);
      play1.disconnect();
      done();
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.LOBBY_LEFT, () => {
      debug('play1 left lobby');
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.playerList.length).to.be.equal(2);
      play2.disconnect();
    });

    play1.connect();
  });
});
