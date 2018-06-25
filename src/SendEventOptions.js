import { ReceiverGroup } from './ReceiverGroup';

class SendEventOptions {
    constructor() {
        this.cachingOption = 0;
        this.receiverGroup = ReceiverGroup.All;
        // this.targetActorIds = null;
    }
}

export { SendEventOptions };