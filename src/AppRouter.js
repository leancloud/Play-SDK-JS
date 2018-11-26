import request from 'superagent';
import _ from 'lodash';

import { debug, warn, error } from './Logger';
import {
  PlayVersion,
  NorthCNServerURL,
  EastCNServerURL,
  USServerURL,
} from './Config';
import Region from './Region';
import isWeapp from './Utils';
import { PlayErrorCode, PlayError } from './PlayError';

export default class AppRouter {
  constructor({ appId, insecure, feature }) {
    this._appId = appId;
    this._insecure = insecure;
    this._feature = feature;
    this._nextConnectTimestamp = 0;
    this._connectFailedCount = 0;
    this._serverValidTimeStamp = 0;
  }

  connect(gameVersion) {
    debug(`AppRouter connect(${gameVersion})`);
    return new Promise((resolve, reject) => {
      if (!_.isString(gameVersion)) {
        throw new TypeError(`${gameVersion} is not a string`);
      }
      const now = Date.now();
      debug(`${now}, ${this._serverValidTimeStamp}`);
      if (now < this._serverValidTimeStamp) {
        // 在有效期范围内，则不再请求，直接返回
        resolve({
          primaryServer: this._primaryServer,
          secondaryServer: this._secondaryServer,
        });
        this.connect(this._gameVersion);
      } else {
        this._resolve = resolve;
        this._reject = reject;
        debug(`${now}, ${this._nextConnectTimestamp}`);
        if (now < this._nextConnectTimestamp) {
          // 判断连接间隔，如果在间隔内，则延迟连接
          const waitTime = this._nextConnectTimestamp - now;
          debug(`wait time: ${waitTime} for connect`);
          this._connectTimer = setTimeout(() => {
            debug('connect time out');
            clearTimeout(this._connectTimer);
            this._connectTimer = null;
            this._connect(PlayVersion);
          }, waitTime);
        } else {
          this._connect(gameVersion);
        }
      }
    });
  }

  _connect() {
    debug('AppRouter _connect()');
    let masterURL = NorthCNServerURL;
    if (this._region === Region.NorthChina) {
      masterURL = NorthCNServerURL;
    } else if (this._region === Region.EastChina) {
      masterURL = EastCNServerURL;
    } else if (this._region === Region.NorthAmerica) {
      masterURL = USServerURL;
    }
    const query = { appId: this._appId, sdkVersion: PlayVersion };
    // 使用设置覆盖 SDK 判断的 feature
    if (this._feature) {
      query.feature = this._feature;
    } else if (isWeapp) {
      query.feature = 'wechat';
    }
    // 使用 ws
    if (this._insecure) {
      query.insecure = this._insecure;
    }
    this._httpReq = request
      .get(masterURL)
      .query(query)
      .end((err, response) => {
        if (err) {
          // 连接失败，则增加下次连接时间间隔
          this._connectFailedCount += 1;
          this._nextConnectTimestamp =
            Date.now() + 2 ** this._connectFailedCount * 1000;
          this._reject(new PlayError(PlayErrorCode.ROUTER_ERROR, err.message));
        } else {
          const body = JSON.parse(response.text);
          debug(response.text);
          // 重置下次允许的连接时间
          this._connectFailedCount = 0;
          this._nextConnectTimestamp = 0;
          clearTimeout(this._connectTimer);
          this._connectTimer = null;
          const { server, secondary, ttl } = body;
          // 缓存
          this._primaryServer = server;
          this._secondaryServer = secondary;
          // ttl
          this._serverValidTimeStamp = Date.now() + ttl * 1000;
          this._resolve({
            primaryServer: this._primaryServer,
            secondaryServer: this._secondaryServer,
          });
        }
      });
  }

  abort() {
    if (this._httpReq) {
      this._httpReq.abort();
    }
  }
}
