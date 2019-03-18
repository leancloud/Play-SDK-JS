/**
 * 玩家类
 */
export default class Player {
  constructor() {
    this._userId = '';
    this._actorId = -1;
  }

  static _newFromJSONObject(playerJSONObject) {
    const player = new Player();
    player._userId = playerJSONObject.pid;
    player._actorId = playerJSONObject.actorId;
    if (playerJSONObject.attr) {
      player.properties = playerJSONObject.attr;
    } else {
      player.properties = {};
    }
    return player;
  }

  /**
   * 玩家 ID
   * @type {string}
   * @readonly
   */
  get userId() {
    return this._userId;
  }

  /**
   * 房间玩家 ID
   * @type {number}
   * @readonly
   */
  get actorId() {
    return this._actorId;
  }

  /**
   * 判断是不是当前客户端玩家
   * @return {Boolean}
   */
  get isLocal() {
    return (
      this._actorId !== -1 && this._play._player._actorId === this._actorId
    );
  }

  /**
   * 判断是不是主机玩家
   * @return {Boolean}
   */
  get isMaster() {
    return this._actorId !== -1 && this._play._room.masterId === this._actorId;
  }

  /**
   * 判断是不是活跃状态
   * @return {Boolean}
   */
  get isActive() {
    return this.active;
  }

  /**
   * 设置玩家的自定义属性
   * @param {Object} properties 自定义属性
   * @param {Object} [opts] 设置选项
   * @param {Object} [opts.expectedValues] 期望属性，用于 CAS 检测
   */
  async setCustomProperties(properties, { expectedValues = null } = {}) {
    return this._play._setPlayerCustomProperties(
      this._actorId,
      properties,
      expectedValues
    );
  }

  /**
   * 获取自定义属性
   * @return {Object}
   */
  get customProperties() {
    return this.properties;
  }

  // 设置活跃状态
  _setActive(active) {
    this.active = active;
  }

  _mergeProperties(changedProperties) {
    this.properties = Object.assign(this.properties, changedProperties);
  }
}
