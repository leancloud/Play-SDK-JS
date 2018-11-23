import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';

import Connection from './Connection';

const LOBBY_KEEPALIVE_DURATION = 120000;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["_getPingDuration"] }] */
export default class LobbyConnection extends Connection {
  constructor(userId) {
    super(userId);
    this._flag = 'lobby';
  }

  _getPingDuration() {
    return LOBBY_KEEPALIVE_DURATION;
  }
}
