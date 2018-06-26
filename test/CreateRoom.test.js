import Event from '../src/Event';
import RoomOptions from '../src/RoomOptions';
import newPlay from './Utils';

const { expect } = require('chai');

describe('test create room', () => {
  it('test create simple room', done => {
    const roomName = '110';
    const play = newPlay('hello1');
    play.on(Event.OnJoinedLobby, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      play.createRoom(roomName);
    });
    play.on(Event.OnCreatedRoom, () => {
      expect(play.room.name).to.be.equal(roomName);
      play.disconnect();
      done();
    });
    play.connect();
  });

  it('test create custom room', done => {
    const roomName = '111';
    const play = newPlay('hello2');
    play.on(Event.OnJoinedLobby, () => {
      expect(play._sessionToken).to.be.not.equal(null);
      expect(play._masterServer).to.be.not.equal(null);
      const options = new RoomOptions();
      options.visible = false;
      options.emptyRoomTtl = 10000;
      options.maxPlayerCount = 2;
      options.playerTtl = 600;
      const props = {
        title: 'room title',
        level: 2,
      };
      options.customRoomProperties = props;
      options.customRoomPropertiesForLobby = ['level'];
      const expectedUserIds = ['world'];
      play.joinOrCreateRoom(roomName, options, expectedUserIds);
    });
    play.on(Event.OnCreatedRoom, () => {
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
    play1.on(Event.OnJoinedLobby, () => {
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });

    play2.on(Event.OnJoinedLobby, () => {
      play2.createRoom(roomName);
    });
    play2.on(Event.OnCreateRoomFailed, () => {
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

    play1.on(Event.OnJoinedLobby, () => {
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.OnNewPlayerJoinedRoom, newPlayer => {
      expect(play1.player.isMaster()).to.be.equal(true);
      expect(newPlayer.isMaster()).to.be.equal(false);
      expect(play1.player.isLocal()).to.be.equal(true);
      expect(newPlayer.isLocal()).to.be.equal(false);
      expect(play1.room.getPlayerList().length).to.be.equal(2);
      expect(play2.room.getPlayerList().length).to.be.equal(2);
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play2.on(Event.OnJoinedLobby, () => {
      play2.joinRoom(roomName);
    });

    play1.connect();
  });
});
