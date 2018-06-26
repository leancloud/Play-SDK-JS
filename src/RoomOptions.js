'use strict';

const MAX_PLAYER_COUNT = 10;

class RoomOptions {
  constructor() {
    this.opened = true;
    this.visible = true;
    this.emptyRoomTtl = 0;
    this.playerTtl = 0;
    this.maxPlayerCount = 10;
    this.customRoomProperties = null;
    this.customRoomPropertiesForLobby = null;
  }

  toMsg() {
    var options = {};
    if (!this.opened) options.open = this.opened;
    if (!this.visible) options.visible = this.visible;
    if (this.emptyRoomTtl > 0) options.emptyRoomTtl = this.emptyRoomTtl;
    if (this.playerTtl > 0) options.playerTtl = this.playerTtl;
    if (this.maxPlayerCount > 0 && this.maxPlayerCount < MAX_PLAYER_COUNT)
      options.maxMembers = this.maxPlayerCount;
    if (this.customRoomProperties) options.attr = this.customRoomProperties;
    if (this.customRoomPropertiesForLobby)
      options.lobbyAttrKeys = this.customRoomPropertiesForLobby;
    return options;
  }
}

export { RoomOptions };
