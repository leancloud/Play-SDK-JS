import { newPlay } from './Utils';
import Event from '../src/Event';
import ReceiverGroup from '../src/ReceiverGroup';

const debug = require('debug')('Test:MessageQueue');

describe('test message queue', () => {
  it('test message queue', async () => {
    const roomName = 'mq0_r1';
    const p0 = newPlay('mq0_0');
    const p1 = newPlay('mq0_1');
    await p0.connect();
    await p0.createRoom({
      roomName,
    });
    p0.on(Event.PLAYER_ROOM_JOINED, ({ newPlayer }) => {
      debug(`${newPlayer.userId} joined room`);
    });
    p0.on(Event.CUSTOM_EVENT, ({ eventId }) => {
      debug(`received event: ${eventId}`);
    });
    p0.pause();
    await p1.connect();
    await p1.joinRoom(roomName);
    p0.resume();
    p0.pause();
    const options = {
      receiverGroup: ReceiverGroup.MasterClient,
    };
    await p1.sendEvent('hi', null, options);
    return new Promise(resolve => {
      setTimeout(async () => {
        p0.resume();
        await p0.close();
        await p1.close();
        resolve();
      }, 5000);
    });
  });
});
