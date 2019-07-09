/**
 * 玩家类
 */
export default class Player {
  constructor() {
    this._userId = '';
    this._actorId = 0;
    this._active = true;
    this._properties = {};
  }

  /**
   * 玩家 ID
   * @type {String}
   * @readonly
   */
  get userId() {
    return this._userId;
  }

  /**
   * 房间玩家 ID
   * @type {Number}
   * @readonly
   */
  get actorId() {
    return this._actorId;
  }

  /**
   * 判断是不是当前客户端玩家
   * @type {Boolean}
   * @readonly
   */
  get isLocal() {
    return this._actorId !== 0 && this._room._play.userId === this._userId;
  }

  /**
   * 判断是不是主机玩家
   * @type {Boolean}
   * @readonly
   */
  get isMaster() {
    return this._actorId !== 0 && this._room.masterId === this._actorId;
  }

  /**
   * 判断是不是活跃状态
   * @type {Boolean}
   * @readonly
   */
  get isActive() {
    return this._active;
  }

  /**
   * 设置玩家的自定义属性
   * @param {Object} properties 自定义属性
   * @param {Object} [opts] 设置选项
   * @param {Object} [opts.expectedValues] 期望属性，用于 CAS 检测
   */
  async setCustomProperties(properties, { expectedValues = null } = {}) {
    return this._room._play._setPlayerCustomProperties(
      this._actorId,
      properties,
      expectedValues
    );
  }

  /**
   * 获取自定义属性
   * @type {Object}
   * @readonly
   */
  get customProperties() {
    return this._properties;
  }

  _mergeProperties(changedProperties) {
    this._properties = Object.assign(this._properties, changedProperties);
  }
}
