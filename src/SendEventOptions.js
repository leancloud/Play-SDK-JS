import ReceiverGroup from './ReceiverGroup';

export default class SendEventOptions {
  constructor() {
    this.cachingOption = 0;
    this.receiverGroup = ReceiverGroup.All;
    // this.targetActorIds = null;
  }
}
