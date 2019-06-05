import { newPlay, newQCloudPlay } from './Utils';
import { error } from '../src/Logger';
import Event from '../src/Event';

const { expect } = require('chai');
const debug = require('debug')('Test:CreateRoom');

describe('test create room', () => {
  it('test null name room', async () => {
    const p = newPlay('cr1');
    await p.connect();
    await p.createRoom();
    await p.close();
  });

  it('test create simple room', async () => {
    const roomName = 'cr2_r';
    const p = newPlay('cr2');
    await p.connect();
    const room = await p.createRoom({
      roomName,
    });
    expect(room.name).to.be.equal(roomName);
    await p.close();
  });

  it('test create custom room', async () => {
    const roomName = 'cr3_r';
    const p = newPlay('cr3');
    await p.connect();
    const options = {
      visible: false,
      emptyRoomTtl: 10000,
      maxPlayerCount: 2,
      playerTtl: 600,
      customRoomProperties: {
        title: 'room title',
        level: 2,
      },
      customRoomPropertiesKeysForLobby: ['level'],
    };
    const expectedUserIds = ['world'];
    const room = await p.joinOrCreateRoom(roomName, {
      roomOptions: options,
      expectedUserIds,
    });
    expect(room.name).to.be.equal(roomName);
    expect(room.visible).to.be.equal(false);
    expect(room.maxPlayerCount).to.be.equal(2);
    const props = p.room.customProperties;
    expect(props.title).to.be.equal('room title');
    expect(props.level).to.be.equal(2);
    expect(room.expectedUserIds).to.be.deep.equal(['world']);
    await p.close();
  });

  it('test create room failed', async () => {
    const roomName = 'cr4_r';
    const p0 = newPlay('cr4_0');
    const p1 = newPlay('cr4_1');
    await p0.connect();
    await p0.createRoom({ roomName });
    expect(p0.room.name).to.be.equal(roomName);
    await p1.connect();
    try {
      await p1.createRoom({ roomName });
    } catch (err) {
      error(err);
      await p0.close();
      await p1.close();
    }
  });

  it('test isMaster or isLocal', async () => {
    const roomName = 'cr5_r';
    const p0 = newPlay('cr5_0');
    const p1 = newPlay('cr5_1');
    let f0 = false;
    let f1 = false;

    return new Promise(async resolve => {
      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.PLAYER_ROOM_JOINED, async data => {
        const { newPlayer } = data;
        expect(p0.room.playerList.length).to.be.equal(2);
        expect(p0.player.isMaster).to.be.equal(true);
        expect(newPlayer.isMaster).to.be.equal(false);
        expect(p0.player.isLocal).to.be.equal(true);
        expect(newPlayer.isLocal).to.be.equal(false);
        expect(p0.room.playerList.length).to.be.equal(2);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      await p1.connect();
      await p1.joinRoom(roomName);
      expect(p1.room.playerList.length).to.be.equal(2);
      f1 = true;
      if (f0 && f1) {
        await p0.close();
        await p1.close();
        resolve();
      }
    });
  });

  it('test catch state error when create room', done => {
    const p = newPlay('cr7');
    p.createRoom().catch(err => {
      debug(err);
      done();
    });
  });
});
