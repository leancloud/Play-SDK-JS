import d from 'debug';
import Event from '../src/Event';

// import CreateRoomFlag from '../src/CreateRoomFlag';
import { newPlay } from './Utils';

const { expect } = require('chai');

const debug = d('Test:ChangeProperties');

describe('test change properties', () => {
  it('test change room properties', done => {
    const roomName = 'cp311';
    const play1 = newPlay('hello3110');
    const play2 = newPlay('world3110');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
      const props = play1.room.getCustomProperties();
      expect(props.title).to.be.equal('room311');
      expect(props.gold).to.be.equal(1000);
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const props = {
        title: 'room311',
        gold: 1000,
      };
      play2.room.setCustomProperties(props);
    });
    play2.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
      const props = play2.room.getCustomProperties();
      expect(props.title).to.be.equal('room311');
      expect(props.gold).to.be.equal(1000);
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
  });

  it('test change room properties with cas', done => {
    const roomName = '312';
    const play1 = newPlay('hello3120');
    const play2 = newPlay('world3120');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
      const props = play1.room.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.title).to.be.equal('room312');
      expect(props.gold).to.be.equal(1000);
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const props = {
        id: 1,
        title: 'room312',
        gold: 1000,
      };
      play2.room.setCustomProperties(props);

      const p = {
        id: 2,
        gold: 2000,
      };
      const ep = {
        id: 2,
      };
      play2.room.setCustomProperties(p, {
        expectedValues: ep,
      });
    });
    play2.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
      const props = play2.room.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.title).to.be.equal('room312');
      expect(props.gold).to.be.equal(1000);
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
  });

  it('test change player properties', done => {
    const roomName = '313';
    const play1 = newPlay('hello3130');
    const play2 = newPlay('world3130');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, data => {
      const { player } = data;
      const props = player.getCustomProperties();
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
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
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
      play2.player.setCustomProperties(props);
    });
    play2.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, data => {
      const { player } = data;
      const props = player.getCustomProperties();
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
      const { poker } = props;
      expect(poker.flower).to.be.equal(1);
      expect(poker.num).to.be.equal(13);
      expect(props.arr[0]).to.be.equal(true);
      expect(props.arr[1]).to.be.equal(111);
      expect(props.arr[2].flower).to.be.equal(1);
      expect(props.arr[2].num).to.be.equal(13);
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
  });

  it('test change player properties with cas', done => {
    const roomName = '316';
    const play1 = newPlay('hello3160');
    const play2 = newPlay('world3160');
    let p1Flag = false;
    let p2Flag = false;

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      play2.connect();
    });
    play1.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, data => {
      const { player } = data;
      const props = player.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
      p1Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const props = {
        id: 1,
        nickname: 'Li Lei',
        gold: 1000,
      };
      play2.player.setCustomProperties(props);

      const p = {
        nickname: 'Jim',
      };
      const ep = {
        id: 0,
      };
      play2.player.setCustomProperties(p, {
        expectedValues: ep,
      });
    });
    play2.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, data => {
      const { player } = data;
      const props = player.getCustomProperties();
      expect(props.id).to.be.equal(1);
      expect(props.nickname).to.be.equal('Li Lei');
      expect(props.gold).to.be.equal(1000);
      p2Flag = true;
      if (p1Flag && p2Flag) {
        play1.disconnect();
        play2.disconnect();
        done();
      }
    });

    play1.connect();
  });

  it('test get player properties when join room', done => {
    const roomName = '315';
    const play1 = newPlay('hello3150');
    const play2 = newPlay('world3150');

    play1.on(Event.CONNECTED, () => {
      play1.createRoom({ roomName });
    });
    play1.on(Event.ROOM_CREATED, () => {
      expect(play1.room.name).to.be.equal(roomName);
      const props = {
        ready: true,
      };
      play1.player.setCustomProperties(props);
    });
    play1.on(Event.PLAYER_CUSTOM_PROPERTIES_CHANGED, () => {
      play2.connect();
    });

    play2.on(Event.CONNECTED, () => {
      play2.joinRoom(roomName);
    });
    play2.on(Event.ROOM_JOINED, () => {
      expect(play2.room.name).to.be.equal(roomName);
      const { master } = play2.room;
      debug(master);
      const me = play2.room.getPlayer(play2.player.actorId);
      debug(me);
      expect(master.getCustomProperties().ready).to.be.equal(true);
      play1.disconnect();
      play2.disconnect();
      done();
    });

    play1.connect();
  });

  // it('test change room properties failed', done => {
  //   const roomName = '311';
  //   const play1 = newPlay('hello3170');
  //   const play2 = newPlay('world3170');
  //   let p1Flag = false;
  //   let p2Flag = false;

  //   play1.on(Event.LOBBY_JOINED, () => {
  //     expect(play1._sessionToken).to.be.not.equal(null);
  //     play1.createRoom({ roomName,
  //       roomOptions: {
  //         flag: CreateRoomFlag.MasterUpdateRoomProperties,
  //       }
  //     });
  //   });
  //   play1.on(Event.ROOM_CREATED, () => {
  //     expect(play1.room.name).to.be.equal(roomName);
  //     play2.joinRoom(roomName);
  //   });
  //   play1.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
  //     const props = play1.room.getCustomProperties();
  //     expect(props.title).to.be.equal('room311');
  //     expect(props.gold).to.be.equal(1000);
  //     p1Flag = true;
  //     if (p1Flag && p2Flag) {
  //       play1.disconnect();
  //       play2.disconnect();
  //       done();
  //     }
  //   });

  //   play2.on(Event.LOBBY_JOINED, () => {
  //     expect(play2._sessionToken).to.be.not.equal(null);
  //   });
  //   play2.on(Event.ROOM_JOINED, () => {
  //     expect(play2.room.name).to.be.equal(roomName);
  //     const props = {
  //       title: 'room311',
  //       gold: 1000,
  //     };
  //     play2.room.setCustomProperties(props);
  //   });
  //   play2.on(Event.ROOM_CUSTOM_PROPERTIES_CHANGED, () => {
  //     const props = play2.room.getCustomProperties();
  //     expect(props.title).to.be.equal('room311');
  //     expect(props.gold).to.be.equal(1000);
  //     p2Flag = true;
  //     if (p1Flag && p2Flag) {
  //       play1.disconnect();
  //       play2.disconnect();
  //       done();
  //     }
  //   });

  //   play1.connect();
  //   play2.connect();
  // });
});
