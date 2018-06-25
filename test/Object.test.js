var expect = require('chai').expect;

import {
    PlayObject,
    PlayArray
} from '../src/PlayObject';

describe('test object', function () {
    it('test object', function (done) {
        var obj = new PlayObject();
        obj.putBool('bbb', true);
        obj.putNumber('iii', 123);
        obj.putNumber('fff', 3.14);
        obj.putString('sss', 'hello, world');
        obj.putNull('nnn');
        var o = new PlayObject();
        o.putString('name', 'hahaha');
        o.putNumber('age', 10);
        obj.putPlayObject('ooo', o);
        var a = new PlayArray();
        a.addBool(true);
        a.addNumber(23);
        a.addString('xxx');
        obj.putPlayObject('aaa', a);
        obj.putBoolArray('bs', [true, false, true]);
        obj.putNumberArray('ns', [1, 100, 23]);
        obj.putStringArray('ss', ['aaa', 'bbb']);
        console.log(obj.toJson());
        expect(obj.toJson()).to.be.deep.equal({
            bbb: true,
            iii: 123,
            fff: 3.14,
            nnn: null,
            sss: 'hello, world',
            ooo: {
                'name': 'hahaha',
                'age': 10
            },
            aaa: [
                true,
                23,
                'xxx'
            ],
            bs: [true, false, true],
            ns: [1, 100, 23],
            ss: ['aaa', 'bbb'],
        });
        expect(obj.size()).to.be.equal(10);
        expect(obj.getString('sss')).to.be.equal('hello, world');
        expect(obj.isNull('nnn')).to.be.ok;

        var o = obj.getPlayObject('ooo');
        expect(o.getString('name')).to.be.equal('hahaha');
        expect(o.getNumber('age')).to.be.equal(10);

        var a = obj.getPlayArray('aaa');
        expect(a.getBool(0)).to.be.ok;
        expect(a.getNumber(1)).to.be.equal(23);
        expect(a.getString(2)).to.be.equal('xxx');

        expect(obj.containsKey('sss')).to.be.ok;
        expect(obj.containsKey('asd')).to.be.not.ok;

        expect(obj.getBoolArray('bs')).to.be.deep.equal([true, false, true]);
        expect(obj.getNumberArray('ns')).to.be.deep.equal([1, 100, 23]);
        expect(obj.getStringArray('ss')).to.be.deep.equal(['aaa', 'bbb']);

        done();
    });

    it('test array', function (done) {
        var arr = new PlayArray();
        arr.addBool(true);
        arr.addNumber(111);
        arr.addString('code');
        arr.addNull();
        var obj = new PlayObject();
        obj.putNumber('id', 22);
        obj.putString('name', 'Han Meimei');
        arr.addPlayObject(obj);
        var a = new PlayArray();
        a.addBool(true);
        a.addNumber(23);
        a.addString('xxx');
        arr.addPlayArray(a);
        arr.addBoolArray([ true, false, true ]);
        arr.addNumberArray([ 1, 2, 3 ]);
        arr.addStringArray([ 'a', 'b', 'c' ]);
        console.log(arr.toJson());
        expect(arr.toJson()).to.be.deep.equal([
            true, 
            111, 
            'code', 
            null, 
            {
                'id': 22,
                'name': 'Han Meimei',
            },
            [
                true,
                23,
                'xxx'
            ],
            [ true, false, true ],
            [ 1, 2, 3 ],
            [ 'a', 'b', 'c' ]
        ]);
        expect(arr.size()).to.be.equal(9);
        expect(arr.getBool(0)).to.be.ok;
        expect(arr.getNumber(1)).to.be.equal(111);
        expect(arr.getString(2)).to.be.equal('code');
        expect(arr.isNull(3)).to.be.ok;

        var obj = arr.getPlayObject(4);
        expect(obj.getNumber('id')).to.be.equal(22);
        expect(obj.getString('name')).to.be.equal('Han Meimei');

        var a = arr.getPlayArray(5);
        expect(a.getBool(0)).to.be.ok;
        expect(a.getNumber(1)).to.be.equal(23);
        expect(a.getString(2)).to.be.equal('xxx');

        expect(arr.contains('code')).to.be.ok;
        expect(arr.contains(obj)).to.be.not.ok;

        done();
    });
});