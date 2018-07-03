/**
 * Play 选项类，用于初始化 Play
 */
export default class PlayOptions {
  constructor() {
    /**
     * APP ID
     * @type {string}
     */
    this.appId = null;
    /**
     * APP KEY
     * @type {string}
     */
    this.appKey = null;
    /**
     * 节点地区
     * @type {Region}
     */
    this.region = null;
  }
}
