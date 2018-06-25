import {
    Play, 
    Room, 
    Player, 
    Event, 
    RoomOptions, 
    ReceiverGroup, 
    SendEventOptions 
} from '../src/index';
import {
    APP_ID,
    APP_KEY,
} from './Config';

function newPlay(userId) {
    var play = new Play();
    play.init(APP_ID, APP_KEY);
    play.userId = userId;
    return play;
}

export { newPlay } 