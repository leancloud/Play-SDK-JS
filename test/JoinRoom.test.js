import { newPlay } from './Utils';
import Event from '../src/Event';

const debug = require('debug')('Test:JoinRoom');

describe('test join room', () => {
  it('test join name room', async () => {
    const roomName = 'jr0_r1';
    const p0 = newPlay('jr0_0');
    const p1 = newPlay('jr0_1');
    await p0.connect();
    await p0.createRoom({
      roomName,
    });
    await p1.connect();
    await p1.joinRoom(roomName);
    await p0.close();
    await p1.close();
  });

  it('test join random room', async () => {
    const roomName = 'jr1_r';
    const p0 = newPlay('jr1_0');
    const p1 = newPlay('jr1_1');
    await p0.connect();
    await p0.createRoom(roomName);
    await p1.connect();
    await p1.joinRandomRoom();
    await p0.close();
    await p1.close();
  });

  it('test join with expected userIds', async () => {
    const roomName = 'jr2_r';
    const p0 = newPlay('jr2_0');
    const p1 = newPlay('jr2_1');
    const p2 = newPlay('jr2_2');

    await p0.connect();
    const options = {
      maxPlayerCount: 2,
    };
    await p0.createRoom({
      roomName,
      roomOptions: options,
      expectedUserIds: ['jr2_2'],
    });

    await p1.connect();
    try {
      await p1.joinRoom(roomName);
    } catch (err) {
      debug(err);
      await p2.connect();
      await p2.joinRoom(roomName);
      await p0.close();
      await p1.close();
      await p2.close();
    }
  });

  it('test leave room', () =>
    new Promise(async resolve => {
      const roomName = 'jr3_r';
      const p0 = newPlay('jr3_0');
      const p1 = newPlay('jr3_1');

      await p0.connect();
      await p0.createRoom({ roomName });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.PLAYER_ROOM_LEFT, async () => {
        await p0.close();
        await p1.close();
        resolve();
      });
      p0.leaveRoom();
    }));

  it('test rejoin room', async () => {
    const roomName = 'jr4_r';
    const p0 = newPlay('jr4_0');
    const p1 = newPlay('jr4_1');

    await p0.connect();
    const options = {
      playerTtl: 600,
    };
    await p0.createRoom({
      roomName,
      roomOptions: options,
    });
    p0.on(Event.PLAYER_ACTIVITY_CHANGED, data => {
      const { player } = data;
      debug(`${player.userId}'s activity is ${player.isActive()}`);
    });

    await p1.connect();
    await p1.joinRoom(roomName);
    await p1.close();
    await p1.connect();
    await p1.rejoinRoom(roomName);

    await p0.close();
    await p1.close();
  });

  it('test reconnectAndRejoin room', async () => {
    const roomName = 'jr5_r';
    const p0 = newPlay('jr5_0');
    const p1 = newPlay('jr5_1');

    await p0.connect();
    const options = {
      playerTtl: 600,
    };
    await p0.createRoom({
      roomName,
      roomOptions: options,
    });

    await p1.connect();
    await p1.joinRoom(roomName);
    await p1.close();
    await p1.reconnectAndRejoin();

    await p0.close();
    await p1.close();
  });

  it('test join name room failed', async () => {
    const roomName = 'jr6_r0';
    const roomName2 = 'jr6_r1';
    const p0 = newPlay('jr6_0');
    const p1 = newPlay('jr6_1');

    await p0.connect();
    await p0.createRoom({ roomName });

    await p1.connect();
    try {
      await p1.joinRoom(roomName2);
    } catch (err) {
      debug(err);
      await p0.close();
      await p1.close();
    }
  });

  it('test join random room with match properties', async () => {
    const roomName = 'jr7_r';
    const p0 = newPlay('jr7_0');
    const p1 = newPlay('jr7_1');
    const p2 = newPlay('jr7_2');

    await p0.connect();
    const matchProps = {
      lv: 2,
    };
    const options = {
      customRoomProperties: matchProps,
      customRoomPropertyKeysForLobby: ['lv'],
    };
    await p0.createRoom({
      roomName,
      roomOptions: options,
    });

    await p1.connect();
    const mp = {
      lv: 2,
    };
    await p1.joinRandomRoom({
      matchProperties: mp,
    });

    await p2.connect();
    try {
      const mp1 = {
        lv: 3,
      };
      await p2.joinRandomRoom({
        matchProperties: mp1,
      });
    } catch (err) {
      debug(err);
      await p0.close();
      await p1.close();
      await p2.close();
    }
  });

  it('test join room concurrently', async () => {
    const roomName = 'jr8_r';
    const p0 = newPlay('jr8_0');
    const p1 = newPlay('jr8_1');
    const p2 = newPlay('jr8_2');

    await p0.connect();
    await p0.createRoom({ roomName });
    p0.on(Event.PLAYER_ROOM_JOINED, data => {
      const { newPlayer } = data;
      debug(`${newPlayer.userId} joined`);
    });

    await p1.connect();
    await p2.connect();
    await p1.joinRoom(roomName);
    await p2.joinRoom(roomName);

    await p0.close();
    await p1.close();
    await p2.close();
  });
});
