import ReceiverGroup from './ReceiverGroup';

/**
 * 发送事件选项类
 */
export default class SendEventOptions {
  constructor() {
    this.cachingOption = 0;
    this.receiverGroup = ReceiverGroup.All;
    // this.targetActorIds = null;
  }
}
