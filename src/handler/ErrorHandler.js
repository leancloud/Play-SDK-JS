import Event from '../Event';
import { error } from '../Logger';

function handleErrorMsg(play, msg) {
  error(`error: ${JSON.stringify(msg)}`);
  play.emit(Event.ERROR, {
    code: msg.reasonCode,
    detail: msg.detail,
  });
}

function handleReasonMsg(play, msg) {
  const { reasonCode, detail } = msg;
  error(`reasonCode: ${reasonCode}, detail: ${detail}`);
  play.emit(Event.ERROR, {
    code: reasonCode,
    detail,
  });
}

export { handleErrorMsg, handleReasonMsg };
