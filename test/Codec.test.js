const { expect } = require('chai');
const debug = require('debug')('Test:Codec');
const messages = require('../src/proto/messages_pb');

const {
  registerType,
  serialize,
  deserialize,
  serializeObject,
  deserializeObject,
} = require('../src/CodecUtils');

describe('test codec', () => {
  // it('test protobuf', async () => {
  //   const sessionOpen = new messages.SessionOpenRequest();
  //   sessionOpen.setAppId('123xxx');
  //   sessionOpen.setPeerId('leancloud');
  //   sessionOpen.setSdkVersion('v0.18.0');
  //   sessionOpen.setGameVersion('1.0');
  //   const request = new messages.RequestMessage();
  //   request.setSessionOpen(sessionOpen);
  //   const body = new messages.Body();
  //   body.setRequest(request);
  //   const command = new messages.Command();
  //   command.setCmd(messages.CommandType.SESSION);
  //   command.setOp(messages.OpType.OPEN);
  //   command.setBody(body.serializeBinary());
  //   debug(command.toObject());
  //   const bytes = command.serializeBinary();
  //   const newCommand = messages.Command.deserializeBinary(bytes);
  //   debug(newCommand.toObject());
  //   const newBody = messages.Body.deserializeBinary(newCommand.getBody());
  //   const newRequest = newBody.getRequest();
  //   const newSessionOpen = newRequest.getSessionOpen();
  //   debug(newSessionOpen.toObject());
  // });

  it('play object', () => {
    const playObj = {
      i: 123,
      b: false,
      str: 'hello, world',
      arr: [666, true, 'engineer'],
    };
    const genericValue = serialize(playObj);
    debug(JSON.stringify(genericValue.toObject()));
    const newPlayObj = deserialize(genericValue);
    debug(JSON.stringify(newPlayObj));
    const { i, b, str, arr } = newPlayObj;
    expect(i).to.be.equal(123);
    expect(b).to.be.equal(false);
    expect(str).to.be.equal('hello, world');
    expect(arr[0]).to.be.equal(666);
    expect(arr[1]).to.be.equal(true);
    expect(arr[2]).to.be.equal('engineer');
  });

  it('play array', () => {
    const playArr = [
      123,
      true,
      'hello, world',
      { i: 23, b: true, str: 'hello' },
    ];
    const bytes = serialize(playArr);
    const newPlayArr = deserialize(bytes);
    expect(newPlayArr[0]).to.be.equal(123);
    expect(newPlayArr[1]).to.be.equal(true);
    expect(newPlayArr[2]).to.be.equal('hello, world');
    const obj = newPlayArr[3];
    debug(JSON.stringify(obj));
    const { i, b, str } = obj;
    expect(i).to.be.equal(23);
    expect(b).to.be.equal(true);
    expect(str).to.be.equal('hello');
  });

  it('custom type', () => {
    class Hero {
      constructor(name, score, hp, mp) {
        this._name = name;
        this._score = score;
        this._hp = hp;
        this._mp = mp;
      }

      print() {
        debug(`${this._name}, ${this._score}, ${this._hp}, ${this._mp}`);
      }
    }

    Hero.serialize = hero => {
      const obj = {
        name: hero._name,
        score: hero._score,
        hp: hero._hp,
        mp: hero._mp,
      };
      return serializeObject(obj);
    };

    Hero.deserialize = bytes => {
      const obj = deserializeObject(bytes);
      const hero = new Hero();
      hero._name = obj.name;
      hero._score = obj.score;
      hero._hp = obj.hp;
      hero._mp = obj.mp;
      return hero;
    };

    registerType(Hero, 10, Hero.serialize, Hero.deserialize);
    const hero = new Hero('Li Lei', 99.9, 10, 8);
    const genericVal = serialize(hero);
    debug(JSON.stringify(genericVal.toObject()));
    const newHero = deserialize(genericVal);
    debug(`new hero: ${JSON.stringify(newHero)}`);
    newHero.print();
  });
});
