import { Event } from '../Event';

function handleErrorMsg(play, msg) {
    console.error('error: ' + JSON.stringify(msg));
    play.emit(Event.OnError, msg.code, msg.detail);
}

export { handleErrorMsg }