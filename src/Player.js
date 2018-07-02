export default class Player {
  constructor(play) {
    this._play = play;
    this.userId = '';
    this.actorId = -1;
  }

  static _newFromJSONObject(play, playerJSONObject) {
    const player = new Player(play);
    player._initWithJSONObject(playerJSONObject);
    return player;
  }

  _initWithJSONObject(playerJSONObject) {
    this.userId = playerJSONObject.pid;
    this.actorId = playerJSONObject.actorId;
    if (playerJSONObject.properties) {
      this.properties = playerJSONObject.properties;
    } else {
      this.properties = {};
    }
  }

  // 判断是不是当前客户端玩家
  isLocal() {
    return this.actorId !== -1 && this._play._player.actorId === this.actorId;
  }

  // 判断是不是主机玩家
  isMaster() {
    return (
      this.actorId !== -1 && this._play._room.masterActorId === this.actorId
    );
  }

  // 判断是不是活跃状态
  isInActive() {
    return this.inActive;
  }

  // 设置活跃状态
  _setActive(active) {
    this.inActive = !active;
  }

  // 设置自定义属性接口
  setCustomProperties(properties, { expectedValues = null } = {}) {
    this._play._setPlayerCustomProperties(
      this.actorId,
      properties,
      expectedValues
    );
  }

  getCustomProperties() {
    return this.properties;
  }

  _mergeProperties(changedProperties) {
    this.properties = Object.assign(this.properties, changedProperties);
  }
}
