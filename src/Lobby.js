import LobbyService from './LobbyService';
import LobbyConnection, { ROOM_LIST_UPDATED_EVENT } from './LobbyConnection';

/**
 * 大厅类，用来请求和接收大厅相关事件
 */
export default class Lobby {
  constructor(opts) {
    this._opts = opts;
  }

  async join() {
    this._lobbyConn = new LobbyConnection();
    const { sessionToken } = await this._lobbyService.authorize();
    await this._lobbyConn.connect(
      this._appId,
      this._playServer,
      this._gameVersion,
      this._userId,
      sessionToken
    );
    await this._lobbyConn.joinLobby();
  }

  async leave() {
    await this._lobbyConn.leaveLobby();
    await this._lobbyConn.close();
  }

  async close() {
    await this._lobbyConn.close();
  }
}
