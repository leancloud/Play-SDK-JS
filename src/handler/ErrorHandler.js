import Event from '../Event';
import { _error } from '../Logger';

export default function handleErrorMsg(play, msg) {
  _error(`error: ${JSON.stringify(msg)}`);
  play.emit(Event.ERROR, {
    code: msg.reasonCode,
    detail: msg.detail,
  });
}
