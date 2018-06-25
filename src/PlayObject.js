'use strict';

class PlayObject {
    constructor() {
        this._data = {};
    }

    static newFromJSONObject(jsonObj) {
        var obj = new PlayObject();
        obj._data = jsonObj;
        return obj;
    }

    // Setter
    putBool(key, b) {
        this._data[key] = b;
    }

    putBoolArray(key, bs) {
        this._data[key] = bs;
    }

    putNumber(key, n) {
        this._data[key] = n;
    }

    putNumberArray(key, ns) {
        this._data[key] = ns;
    }

    putString(key, s) {
        this._data[key] = s;
    }

    putStringArray(key, ss) {
        this._data[key] = ss;
    }

    putNull(key) {
        this._data[key] = null;
    }

    putPlayObject(key, obj) {
        this._data[key] = obj._data;
    }

    putPlayArray(key, arr) {
        this._data[key] = arr._data;
    }

    // Getter
    getBool(key) {
        return this._data[key];
    }

    getBoolArray(key) {
        return this._data[key];
    }

    getNumber(key) {
        return this._data[key];
    }

    getNumberArray(key) {
        return this._data[key];
    }

    getString(key) {
        return this._data[key];
    }

    getStringArray(key) {
        return this._data[key];
    }

    isNull(key) {
        return this._data[key] === null;
    }

    getPlayObject(key) {
        return PlayObject.newFromJSONObject(this._data[key]);
    }

    getPlayArray(key) {
        return PlayArray.newFromJSONArray(this._data[key]);
    }

    // 
    getKeys() {
        return Object.keys(this._data);
    }

    containsKey(key) {
        return key in this._data;
    }

    size() {
        return Object.keys(this._data).length;
    }

    merge(obj) {
        if (!(obj instanceof PlayObject)) {
            console.error("merge only support PlayObject");
            return;
        }
        for (var key in obj._data) {
            this._data[key] = obj._data[key];
        }
    }

    toJson() {
        return this._data;
    }
}

class PlayArray {
    constructor() {
        this._data = [];
    }

    static newFromJSONArray(jsonArr) {
        var arr = new PlayArray();
        arr._data = jsonArr;
        return arr;
    }

    // add
    addBool(b) {
        this._data.push(b);
    }

    addBoolArray(bs) {
        this._data.push(bs);
    }

    addNumber(n) {
        this._data.push(n);
    }

    addNumberArray(ns) {
        this._data.push(ns);
    }

    addString(s) {
        this._data.push(s);
    }

    addStringArray(ss) {
        this._data.push(ss);
    }

    addNull() {
        this._data.push(null);
    }

    addPlayObject(obj) {
        this._data.push(obj._data);
    }

    addPlayArray(arr) {
        this._data.push(arr._data);
    }

    // get
    getBool(i) {
        return this._data[i];
    }

    getBoolArray(i) {
        return this._data[i];
    }

    getNumber(i) {
        return this._data[i];
    }

    getNumberArray(i) {
        return this._data[i];
    }

    getString(i) {
        return this._data[i];
    }

    getStringArray(i) {
        return this._data[i];
    }

    isNull(i) {
        return this._data[i] === null;
    }

    getPlayObject(i) {
        return PlayObject.newFromJSONObject(this._data[i]);
    }

    getPlayArray(i) {
        return PlayArray.newFromJSONArray(this._data[i]);
    }

    //
    contains(obj) {
        if ((obj instanceof PlayArray) || (obj instanceof PlayObject)) {
            console.error('PlayArray and PlayObject are not support!');
            return false;
        }
        for (var i = 0; i < this._data.length; i++) {
            var d = this._data[i];
            if (d === obj) {
                return true;
            }
        }
        return false;
    }

    size() {
        return Object.keys(this._data).length;
    }

    toJson() {
        return this._data;
    }
}

export { PlayObject, PlayArray }