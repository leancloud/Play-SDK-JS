import Event from '../src/Event';
import SendEventOptions from '../src/SendEventOptions';
import ReceiverGroup from '../src/ReceiverGroup';

import newPlay from './Utils';

const { expect } = require('chai');

describe('test custom event', () => {
  it('test custom event with ReceiverGroup', done => {
    const roomName = '511';
    const play1 = newPlay('hello');
    const play2 = newPlay('world');

    play1.on(Event.OnJoinedLobby, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.OnEvent, (eventId, param) => {
      expect(eventId).to.be.equal('hi');
      expect(param.name).to.be.equal('aaaa');
      expect(param.body).to.be.equal('bbbb');
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play2.on(Event.OnJoinedLobby, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
      play2.joinRoom(roomName);
    });
    play2.on(Event.OnJoinedRoom, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const options = new SendEventOptions();
      options.receiverGroup = ReceiverGroup.MasterClient;
      const eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      play2.sendEvent('hi', eventData, options);
    });
    play2.on(Event.OnEvent, (eventId, eventData) => {
      expect(eventId).to.be.equal('hi');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
    });

    play1.connect();
  });

  it('test custom event with target ids', done => {
    const roomName = '515';
    const play1 = newPlay('hello2');
    const play2 = newPlay('world2');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.OnJoinedLobby, () => {
      expect(play1._sessionToken).to.be.not.equal(null);
      play1.createRoom(roomName);
    });
    play1.on(Event.OnCreatedRoom, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.joinRoom(roomName);
    });
    play1.on(Event.OnEvent, (eventId, eventData) => {
      expect(eventId).to.be.equal('hello');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.OnJoinedLobby, () => {
      expect(play2._sessionToken).to.be.not.equal(null);
    });
    play2.on(Event.OnJoinedRoom, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const options = new SendEventOptions();
      options.targetActorIds = [1, 2];
      const eventData = {
        name: 'aaaa',
        body: 'bbbb',
      };
      play2.sendEvent('hello', eventData, options);
    });
    play2.on(Event.OnEvent, (eventId, eventData) => {
      expect(eventId).to.be.equal('hello');
      expect(eventData.name).to.be.equal('aaaa');
      expect(eventData.body).to.be.equal('bbbb');
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
    play2.connect();
  });
});
