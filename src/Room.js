'use strict';

import { Player } from './Player';

class Room {
  constructor(play) {
    this.play = play;
  }

  static newFromJSONObject(play, roomJSONObject) {
    var room = new Room(play);
    room.name = roomJSONObject.cid;
    room.opened = roomJSONObject.open;
    room.visible = roomJSONObject.visible;
    room.maxPlayerCount = roomJSONObject.maxMembers;
    room.masterActorId = roomJSONObject.masterActorId;
    room.expectedUserIds = roomJSONObject.expectMembers;
    room.players = {};
    for (var i = 0; i < roomJSONObject.members.length; i++) {
      var playerDTO = roomJSONObject.members[i];
      var player = Player.newFromJSONObject(play, playerDTO);
      if (player.userId === play.userId) {
        play.player = player;
      }
      room.players[player.actorId] = player;
    }
    if (roomJSONObject.attr) {
      room.properties = roomJSONObject.attr;
    } else {
      room.properties = {};
    }
    return room;
  }

  addPlayer(newPlayer) {
    this.players[newPlayer.actorId] = newPlayer;
  }

  removePlayer(actorId) {
    delete this.players[actorId];
  }

  getPlayer(actorId) {
    var player = this.players[actorId];
    if (player === null) {
      console.error('not found player: ' + actorId);
    }
    return player;
  }

  getPlayerList() {
    var playerList = new Array();
    for (var key in this.players) {
      var player = this.players[key];
      playerList.push(player);
    }
    return playerList;
  }

  setMasterId(newMasterId) {
    this.masterActorId = newMasterId;
  }

  setOpened(opened) {
    this.opened = opened;
  }

  setVisible(visible) {
    this.visible = visible;
  }

  setCustomProperties(properties, expectedValues = null) {
    this.play.setRoomCustomProperties(properties, expectedValues);
  }

  getCustomProperties() {
    return this.properties;
  }

  mergeProperties(changedProperties) {
    this.properties = Object.assign(this.properties, changedProperties);
  }
}

export { Room };
