import { newPlay } from './Utils';
import Event from '../src/Event';

const { expect } = require('chai');
const debug = require('debug')('Test:JoinRoom');

describe('test join room', () => {
  it('test join name room', async () => {
    const roomName = 'jr0_r1';
    const p0 = newPlay('jr0_0');
    const p1 = newPlay('jr0_1');
    await p0.connect();
    const room = await p0.createRoom({
      roomName,
    });
    expect(room.name).to.be.equal(roomName);
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
    const room = await p1.joinRandomRoom();
    expect(room).to.be.not.equal(undefined);
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
      const p0Room = await p0.createRoom({ roomName });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.PLAYER_ROOM_LEFT, async () => {
        await p0.close();
        await p1.close();
        resolve();
      });
      await p0Room.leave();
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
      debug(`${player.userId}'s activity is ${player.isActive}`);
    });
    await p1.connect();
    await p1.joinRoom(roomName);
    await p1._simulateDisconnection();

    const room = await p1.rejoinRoom(roomName);
    expect(room.name).to.be.equal(roomName);
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
    p1.on(Event.DISCONNECTED, async () => {
      debug('disconnected');
      await p1.reconnectAndRejoin();
      await p0.close();
      await p1.close();
    });
    p1._simulateDisconnection();
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
    const p3 = newPlay('jr7_3');
    const p4 = newPlay('jr7_2');
    await p0.connect();
    const matchProps = {
      lv: 2,
    };
    const options = {
      maxPlayerCount: 3,
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
      expectedUserIds: ['jr7_2'],
    });
    // 模拟条件不匹配情况
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
      const { code } = err;
      expect(code).to.be.equal(4301);
      p2.close();
    }
    // 模拟占坑不匹配情况
    await p3.connect();
    try {
      await p3.joinRandomRoom({ matchProperties: mp });
    } catch (err) {
      debug(err);
      const { code } = err;
      expect(code).to.be.equal(4301);
      p3.close();
    }
    // 模拟条件和占坑都满足的情况
    await p4.connect();
    await p4.joinRandomRoom({ matchProperties: mp });
    p0.close();
    p1.close();
    p4.close();
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

  it('test match random', async () => {
    const roomName = 'jr9_r';
    const p0 = newPlay('jr9_0');
    const p1 = newPlay('jr9_1');
    try {
      await p0.connect();
      const props = {
        lv: 2,
      };
      const options = {
        customRoomProperties: props,
        customRoomPropertyKeysForLobby: ['lv'],
      };
      await p0.createRoom({
        roomName,
        roomOptions: options,
      });
      await p1.connect();
      const matchProps = {
        lv: 2,
      };
      const lobbyRoom = await p1.matchRandom('jr9_1', {
        matchProperties: matchProps,
      });
      debug(JSON.stringify(lobbyRoom));
      await p1.joinRoom(lobbyRoom.roomName);
      p0.close();
      p1.close();
    } catch (err) {
      debug(err);
      p0.close();
      p1.close();
    }
  });

  it('test match random with expected users', async () => {
    const roomName = 'jr10_r';
    const p0 = newPlay('jr10_0');
    const p1 = newPlay('jr10_1');
    const p2 = newPlay('jr10_2');
    const p3 = newPlay('jr10_xxx');
    await p0.connect();
    const props = {
      name: roomName,
    };
    const options = {
      maxPlayerCount: 3,
      customRoomProperties: props,
      customRoomPropertyKeysForLobby: ['name'],
    };
    await p0.createRoom({
      roomName,
      roomOptions: options,
    });
    await p1.connect();
    const matchProps = {
      name: roomName,
    };
    await p1.matchRandom('jr10_1', {
      matchProperties: matchProps,
      expectedUserIds: ['jr10_xxx'],
    });
    try {
      await p2.connect();
      // 预期失败
      await p2.joinRandomRoom({
        matchProperties: matchProps,
      });
    } catch (err) {
      debug(err);
      const { code } = err;
      expect(code).to.be.equal(4301);
      p2.close();
    }
    await p3.connect();
    // 预期成功
    await p3.joinRandomRoom({
      matchProperties: matchProps,
    });
    p0.close();
    p1.close();
    p3.close();
  });
});
