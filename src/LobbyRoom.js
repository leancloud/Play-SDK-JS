export default class LobbyRoom {
  constructor(lobbyRoomDTO) {
    this.roomName = lobbyRoomDTO.cid;
    this.addr = lobbyRoomDTO.addr;
    this.secureAddr = lobbyRoomDTO.secureAddr;
    this.maxPlayerCount = lobbyRoomDTO.maxMembers;
    this.expectedUserIds = lobbyRoomDTO.expectMembers;
    this.emptyRoomTtl = lobbyRoomDTO.emptyRoomTtl;
    this.playerTtl = lobbyRoomDTO.playerTtl;
    this.playerCount = lobbyRoomDTO.playerCount;
    if (lobbyRoomDTO.attr) {
      this.customRoomPropertiesForLobby = lobbyRoomDTO.attr;
    }
  }
}
