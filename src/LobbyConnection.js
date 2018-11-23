import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';

import Connection from './Connection';

export default class LobbyConnection extends Connection {
  constructor(userId) {
    super(userId);
    this._flag = 'lobby';
    this._pingDuration = 120000;
  }
}
