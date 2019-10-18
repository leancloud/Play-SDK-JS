import StateMachine from 'javascript-state-machine';

import LobbyConnection, { ROOM_LIST_UPDATED_EVENT } from './LobbyConnection';
import Event from './Event';

/**
 * 大厅类，用来请求和接收大厅相关事件
 */
export default class Lobby {
  constructor(client) {
    this._client = client;
    this._fsm = new StateMachine({
      init: 'init',
      transitions: [
        { name: 'join', from: 'init', to: 'joining' },
        { name: 'joined', from: 'joining', to: 'lobby' },
        { name: 'joinFailed', from: 'joining', to: 'init' },
        { name: 'leave', from: 'lobby', to: 'leaving' },
        { name: 'left', from: 'leaving', to: 'init' },
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
      throw new Error(`Error state: ${this._fsm.state}`);
    }
    this._fsm.join();
    let lobbyInfo = null;
    try {
      lobbyInfo = await this._lobbyService.authorize();
    } catch (e) {
      this._fsm.joinFailed();
      throw e;
    }
    try {
      const { sessionToken } = lobbyInfo;
      this._lobbyConn = new LobbyConnection();
      await this._lobbyConn.connect(
        this._appId,
        this._playServer,
        this._gameVersion,
        this._userId,
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
    await this._lobbyConn.close();
  }
}
