import StateMachine from 'javascript-state-machine';

import LobbyConnection, { ROOM_LIST_UPDATED_EVENT } from './LobbyConnection';
import Event from './Event';
import PlayError from './PlayError';
import PlayErrorCode from './PlayErrorCode';

import { debug } from './Logger';

/**
 * 大厅类，用来请求和接收大厅相关事件
 */
export default class Lobby {
  constructor(client) {
    this._client = client;
    this._fsm = new StateMachine({
      init: 'init',
      final: 'closed',
      transitions: [
        { name: 'join', from: 'init', to: 'joining' },
        { name: 'joined', from: 'joining', to: 'lobby' },
        { name: 'joinFailed', from: 'joining', to: 'init' },
        { name: 'leave', from: 'lobby', to: 'leaving' },
        {
          name: 'close',
          from: ['init', 'joining', 'lobby', 'leaving'],
          to: 'closed',
        },
      ],
      methods: {
        onEnterLobby: () => {
          this._lobbyConn.on(ROOM_LIST_UPDATED_EVENT, roomList => {
            // 房间列表更新
            this._lobbyRoomList = roomList;
            this._client.emit(Event.LOBBY_ROOM_LIST_UPDATED);
          });
        },
        onExitLobby: () => {
          this._lobbyConn.removeAllListeners();
        },
      },
    });
  }

  async join() {
    if (this._fsm.cannot('join')) {
      throw new PlayError(
        PlayErrorCode.STATE_ERROR,
        `Error state: ${this._fsm.state}`
      );
    }
    this._fsm.join();
    let lobbyInfo = null;
    try {
      const { _lobbyService } = this._client;
      lobbyInfo = await _lobbyService.authorize();
    } catch (e) {
      this._fsm.joinFailed();
      throw e;
    }
    try {
      const { url, sessionToken } = lobbyInfo;
      const { _appId, _gameVersion, _userId } = this._client;
      this._lobbyConn = new LobbyConnection();
      // 微信小程序不支持使用 http 协议构造 WebSocket
      const lobbyUrl = url
        .replace('https://', 'wss://')
        .replace('http://', 'ws://');
      debug(`lobby url: ${lobbyUrl}`);
      await this._lobbyConn.connect(
        _appId,
        lobbyUrl,
        _gameVersion,
        _userId,
        sessionToken
      );
      await this._lobbyConn.joinLobby();
      this._fsm.joined();
    } catch (e) {
      if (this._lobbyConn) {
        await this._lobbyConn.close();
      }
      this._fsm.joinFailed();
      throw e;
    }
  }

  async leave() {
    try {
      await this._lobbyConn.leaveLobby();
    } finally {
      await this._lobbyConn.close();
    }
  }

  async close() {
    if (this._fsm.can('close')) {
      await this._lobbyConn.close();
    }
  }
}
