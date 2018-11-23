import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';

import Connection from './Connection';

const GAME_KEEPALIVE_DURATION = 7000;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class GameConnection extends Connection {
  constructor(userId) {
    super(userId);
    this._flag = 'game';
  }

  _getPingDuration() {
    return GAME_KEEPALIVE_DURATION;
  }
}
