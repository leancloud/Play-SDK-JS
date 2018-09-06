import Event from '../Event';
import { error } from '../Logger';

export default function handleErrorMsg(play, msg) {
  error(`error: ${JSON.stringify(msg)}`);
  play.emit(Event.ERROR, {
    code: msg.reasonCode,
    detail: msg.detail,
  });
}
