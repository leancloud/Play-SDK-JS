import { newPlay } from './Utils';
import Event from '../src/Event';

describe('test lobby', () => {
  it('test join lobby manually', async () => {
    const p = newPlay('tl0');
    await p.connect();
    await p.joinLobby();
    await p.disconnect();
  });

  it('test room list update', async () =>
    new Promise(async resolve => {
      const p0 = newPlay('tl1_0');
      const p1 = newPlay('tl1_1');
      const p2 = newPlay('tl1_2');
      const p3 = newPlay('tl1_3');
      await p0.connect();
      await p0.createRoom({ roomName: p0.userId });
      await p1.connect();
      await p1.createRoom({ roomName: p1.userId });
      await p2.connect();
      await p2.createRoom({ roomName: p2.userId });
      await p3.connect();
      await p3.joinLobby();
      p3.on(Event.LOBBY_ROOM_LIST_UPDATED, async () => {
        if (p3.lobbyRoomList.length >= 3) {
          await p0.disconnect();
          await p1.disconnect();
          await p2.disconnect();
          await p3.disconnect();
          resolve();
        }
      });
    }));
});
