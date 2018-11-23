import EventEmitter from 'eventemitter3';
import _ from 'lodash';

import { adapters } from './PlayAdapter';
import { debug, error } from './Logger';
import { PlayVersion } from './Config';

import Connection from './Connection';

export default class GameConnection extends Connection {
  constructor(userId) {
    super(userId);
    this._flag = 'game';
    this._pingDuration = 10000;
  }
}
