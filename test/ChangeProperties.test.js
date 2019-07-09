import d from 'debug';
import Event from '../src/Event';

// import CreateRoomFlag from '../src/CreateRoomFlag';
import { newPlay } from './Utils';

const { expect } = require('chai');

const debug = d('Test:ChangeProperties');

describe('test change properties', () => {
  it('test change room properties', () =>
    new Promise(async resolve => {
      const roomName = 'tcp0_r';
      const p0 = newPlay('tcp0_0');
      const p1 = newPlay('tcp0_1');
      let f0 = false;
      let f1 = false;
      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, async () => {
        const props = p0.room.customProperties;
        expect(props.title).to.be.equal('room311');
        expect(props.gold).to.be.equal(1000);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, async () => {
        const props = p1.room.customProperties;
        expect(props.title).to.be.equal('room311');
        expect(props.gold).to.be.equal(1000);
        f1 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      const props = {
        title: 'room311',
        gold: 1000,
      };
      await p1.room.setCustomProperties(props);
      debug(`current room title: ${props.title}`);
      expect(props.title).to.be.equal('room311');
      debug(`current room gold: ${props.gold}`);
      expect(props.gold).to.be.equal(1000);
    }));

  it('test change room properties with cas', () =>
    new Promise(async resolve => {
      const roomName = 'tcp1_r';
      const p0 = newPlay('tcp1_0');
      const p1 = newPlay('tcp1_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, async () => {
        const props = p0.room.customProperties;
        expect(props.id).to.be.equal(1);
        expect(props.title).to.be.equal('room312');
        expect(props.gold).to.be.equal(1000);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, async () => {
        const props = p1.room.customProperties;
        expect(props.id).to.be.equal(1);
        expect(props.title).to.be.equal('room312');
        expect(props.gold).to.be.equal(1000);
        f1 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });
      // 校验属性，用于「失败」测试
      const p = {
        id: 2,
        gold: 2000,
      };
      const ep = {
        id: 2,
      };
      p1.room.setCustomProperties(p, {
        expectedValues: ep,
      });

      const props = {
        id: 1,
        title: 'room312',
        gold: 1000,
      };
      p1.room.setCustomProperties(props);
    }));

  it('test change player properties', () =>
    new Promise(async resolve => {
      const roomName = 'tcp2_r';
      const p0 = newPlay('tcp2_0');
      const p1 = newPlay('tcp2_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, async data => {
        const { player } = data;
        const props = player.customProperties;
        expect(props.nickname).to.be.equal('Li Lei');
        expect(props.gold).to.be.equal(1000);
        const { poker } = props;
        expect(poker.flower).to.be.equal(1);
        expect(poker.num).to.be.equal(13);
        const { arr } = props;
        expect(arr[0]).to.be.equal(true);
        expect(arr[1]).to.be.equal(111);
        expect(arr[2].flower).to.be.equal(1);
        expect(arr[2].num).to.be.equal(13);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, data => {
        const { player } = data;
        const props = player.customProperties;
        expect(props.nickname).to.be.equal('Li Lei');
        expect(props.gold).to.be.equal(1000);
        const { poker } = props;
        expect(poker.flower).to.be.equal(1);
        expect(poker.num).to.be.equal(13);
        expect(props.arr[0]).to.be.equal(true);
        expect(props.arr[1]).to.be.equal(111);
        expect(props.arr[2].flower).to.be.equal(1);
        expect(props.arr[2].num).to.be.equal(13);
        f1 = true;
        if (f0 && f1) {
          p0.close();
          p1.close();
          resolve();
        }
      });

      const props = {
        nickname: 'Li Lei',
        gold: 1000,
      };
      const poker = {
        flower: 1,
        num: 13,
      };
      props.poker = poker;
      const arr = [true, 111, poker];
      props.arr = arr;
      await p1.player.setCustomProperties(props);
      debug(`current nickname: ${props.nickname}`);
      expect(props.nickname).to.be.equal('Li Lei');
      debug(`current gold: ${props.gold}`);
      expect(props.gold).to.be.equal(1000);
    }));

  it('test change player properties with cas', () =>
    new Promise(async resolve => {
      const roomName = 'tcp3_r';
      const p0 = newPlay('tcp3_0');
      const p1 = newPlay('tcp3_1');
      let f0 = false;
      let f1 = false;

      await p0.connect();
      await p0.createRoom({ roomName });
      p0.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, async data => {
        const { player } = data;
        const props = player.customProperties;
        expect(props.id).to.be.equal(1);
        expect(props.nickname).to.be.equal('Li Lei');
        expect(props.gold).to.be.equal(1000);
        f0 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      await p1.connect();
      await p1.joinRoom(roomName);
      p1.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, async data => {
        const { player } = data;
        const props = player.customProperties;
        expect(props.id).to.be.equal(1);
        expect(props.nickname).to.be.equal('Li Lei');
        expect(props.gold).to.be.equal(1000);
        f1 = true;
        if (f0 && f1) {
          await p0.close();
          await p1.close();
          resolve();
        }
      });

      const p = {
        nickname: 'Jim',
      };
      const ep = {
        id: 0,
      };
      p1.player.setCustomProperties(p, {
        expectedValues: ep,
      });

      const props = {
        id: 1,
        nickname: 'Li Lei',
        gold: 1000,
      };
      p1.player.setCustomProperties(props);
    }));

  it('test get player properties when join room', async () => {
    const roomName = 'tcp4_r';
    const p0 = newPlay('tcp4_0');
    const p1 = newPlay('tcp4_1');

    await p0.connect();
    await p0.createRoom({ roomName });
    const props = {
      ready: true,
    };
    await p0.player.setCustomProperties(props);
    await p1.connect();
    await p1.joinRoom(roomName);
    expect(p1.room.name).to.be.equal(roomName);
    const { master } = p1.room;
    expect(master.customProperties.ready).to.be.equal(true);
    await p0.close();
    await p1.close();
  });

  it('test change properties with same value', async () => {
    const roomName = 'tcp5_r';
    const p0 = newPlay('tcp5_0');

    await p0.connect();
    await p0.createRoom({ roomName });
    const props = {
      ready: true,
    };
    await p0.room.setCustomProperties(props);
    await p0.room.setCustomProperties(props);
    await p0.player.setCustomProperties(props);
    await p0.player.setCustomProperties(props);
    await p0.close();
  });
});
