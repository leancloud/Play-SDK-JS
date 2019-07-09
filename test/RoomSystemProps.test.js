import { newPlay } from './Utils';
import Event from '../src/Event';

const { expect } = require('chai');
const debug = require('debug')('Test:CreateRoom');

describe('test room system props', () => {
  it('test room open', async () =>
    new Promise(async resolve => {
      const p = newPlay('rsp_0');
      await p.connect();
      const pRoom = await p.createRoom();
      p.on(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, async ({ changedProps }) => {
        debug(changedProps);
        const { open } = changedProps;
        expect(open).to.be.equal(false);
        await p.close();
        resolve();
      });
      await pRoom.setOpen(false);
      debug(`current room open: ${p.room.open}`);
      expect(p.room.open).to.be.equal(false);
    }));

  it('test room visible', async () =>
    new Promise(async resolve => {
      const p = newPlay('rsp_1');
      await p.connect();
      const pRoom = await p.createRoom();
      p.on(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, async ({ changedProps }) => {
        debug(changedProps);
        const { visible } = changedProps;
        expect(visible).to.be.equal(false);
        await p.close();
        resolve();
      });
      await pRoom.setVisible(false);
      debug(`current room visible: ${p.room.visible}`);
      expect(p.room.visible).to.be.equal(false);
    }));

  it('test room max player count', async () =>
    new Promise(async resolve => {
      const p = newPlay('rsp_2');
      await p.connect();
      const pRoom = await p.createRoom();
      p.on(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, async ({ changedProps }) => {
        debug(changedProps);
        const { maxPlayerCount } = changedProps;
        expect(maxPlayerCount).to.be.equal(5);
        await p.close();
        resolve();
      });
      await pRoom.setMaxPlayerCount(5);
      debug(`current room max player count: ${p.room.maxPlayerCount}`);
      expect(p.room.maxPlayerCount).to.be.equal(5);
    }));

  it('test set and clear room expected user ids', async () =>
    new Promise(async resolve => {
      let f1 = false;
      let f2 = false;
      const p = newPlay('rsp_3');
      await p.connect();
      const room = await p.createRoom();
      p.on(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, async ({ changedProps }) => {
        debug(changedProps);
        const { expectedUserIds } = changedProps;
        if (expectedUserIds.length === 2 && room.expectedUserIds.length === 2) {
          f1 = true;
        }
        if (expectedUserIds.length === 0 && room.expectedUserIds.length === 0) {
          f2 = true;
        }
        if (f1 && f2) {
          resolve();
          await p.close();
        }
      });
      await room.setExpectedUserIds(['hello', 'world']);
      const expectedUserCount = room.expectedUserIds.length;
      room.expectedUserIds.forEach(id => {
        debug(id);
      });
      expect(expectedUserCount).to.be.equal(2);
      await room.clearExpectedUserIds();
      expect(room.expectedUserIds.length).to.be.equal(0);
    }));

  it('test add and remove room expected user ids', async () =>
    new Promise(async resolve => {
      let f1 = false;
      let f2 = false;
      let f3 = false;
      const p = newPlay('rsp_4');
      await p.connect();
      const room = await p.createRoom();

      p.on(Event.ROOM_SYSTEM_PROPERTIES_CHANGED, async ({ changedProps }) => {
        debug(changedProps);
        const { expectedUserIds } = changedProps;
        if (expectedUserIds.length === 1 && room.expectedUserIds.length === 1) {
          f1 = true;
        }
        if (expectedUserIds.length === 3 && room.expectedUserIds.length === 3) {
          f2 = true;
        }
        if (expectedUserIds.length === 2 && room.expectedUserIds.length === 2) {
          f3 = true;
        }
        if (f1 && f2 && f3) {
          await p.close();
          resolve();
        }
      });

      await room.setExpectedUserIds(['hello']);
      room.expectedUserIds.forEach(id => {
        debug(id);
      });
      expect(room.expectedUserIds.length).to.be.equal(1);
      await room.addExpectedUserIds(['csharp', 'js']);
      room.expectedUserIds.forEach(id => {
        debug(id);
      });
      expect(room.expectedUserIds.length).to.be.equal(3);
      await room.removeExpectedUserIds(['hello']);
      room.expectedUserIds.forEach(id => {
        debug(id);
      });
      expect(room.expectedUserIds.length).to.be.equal(2);
    }));
});
