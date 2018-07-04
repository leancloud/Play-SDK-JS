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
    /**
     * 是否在连接成功后自动加入大厅，默认值为 true
     * @type {boolean}
     */
    this.autoJoinLobby = true;
  }
}
