import { newPlay } from './Utils';
import Event from '../src/Event';
import ReceiverGroup from '../src/ReceiverGroup';

const { expect } = require('chai');

describe('test custom event', () => {
  it('test custom event with ReceiverGroup', async () =>
    new Promise(async resolve => {
      const roomName = 'tce0_r';
      const p0 = newPlay('tce0_0');
      const p1 = newPlay('tce0_1');

      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.CUSTOM_EVENT, async event => {
        const { eventId, eventData } = event;
        expect(eventId).to.be.equal('hi');
        expect(eventData.name).to.be.equal('aaaa');
        expect(eventData.body).to.be.equal('bbbb');
        await p0.disconnect();
        await p1.disconnect();
        resolve();
      });

      await p1.connect();
      await p1.joinRoom(roomName);
      const eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      const options = {
        receiverGroup: ReceiverGroup.MasterClient,
      };
      p1.sendEvent('hi', eventData, options);
    }));

  it('test custom event with target ids', async () =>
    new Promise(async resolve => {
      const roomName = 'tce1_r';
      const p0 = newPlay('tce1_0');
      const p1 = newPlay('tce1_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.CUSTOM_EVENT, async event => {
        const { eventId, eventData } = event;
        expect(eventId).to.be.equal('hello');
        expect(eventData.name).to.be.equal('aaaa');
        expect(eventData.body).to.be.equal('bbbb');
        f0 = true;
        if (f0 && f1) {
          await p0.disconnect();
          await p1.disconnect();
          resolve();
        }
      });

      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.CUSTOM_EVENT, async event => {
        const { eventId, eventData } = event;
        expect(eventId).to.be.equal('hello');
        expect(eventData.name).to.be.equal('aaaa');
        expect(eventData.body).to.be.equal('bbbb');
        f1 = true;
        if (f0 && f1) {
          await p0.disconnect();
          await p1.disconnect();
          resolve();
        }
      });
      const eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      const options = {
        targetActorIds: [1, 2],
      };
      p1.sendEvent('hello', eventData, options);
    }));
});
