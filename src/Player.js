export default class Player {
  constructor(play) {
    this.play = play;
    this.userId = '';
    this.actorId = -1;
  }

  static newFromJSONObject(play, playerJSONObject) {
    const player = new Player(play);
    player.initWithJSONObject(playerJSONObject);
    return player;
  }

  initWithJSONObject(playerJSONObject) {
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
    return this.actorId !== -1 && this.play.player.actorId === this.actorId;
  }

  // 判断是不是主机玩家
  isMaster() {
    return this.actorId !== -1 && this.play.room.masterActorId === this.actorId;
  }

  // 判断是不是活跃状态
  isInActive() {
    return this.inActive;
  }

  // 设置活跃状态
  setActive(active) {
    this.inActive = !active;
  }

  // 设置自定义属性接口
  setCustomProperties(properties, expectedValues = null) {
    this.play.setPlayerCustomProperties(
      this.actorId,
      properties,
      expectedValues
    );
  }

  getCustomProperties() {
    return this.properties;
  }

  mergeProperties(changedProperties) {
    this.properties = Object.assign(this.properties, changedProperties);
  }
}
