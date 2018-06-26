import Event from '../Event';

export default function handleErrorMsg(play, msg) {
  console.error(`error: ${JSON.stringify(msg)}`);
  play.emit(Event.OnError, msg.reasonCode, msg.detail);
}
