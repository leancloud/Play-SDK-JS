import Play from './Play';
import Region from './Region';
import Room from './Room';
import Player from './Player';
import Event from './Event';
import ReceiverGroup from './ReceiverGroup';
import CreateRoomFlag from './CreateRoomFlag';
import { setAdapters } from './PlayAdapter';
import { LogLevel, setLogger } from './Logger';

const p = new Play();

export {
  p,
  Play,
  Region,
  Room,
  Player,
  Event,
  ReceiverGroup,
  CreateRoomFlag,
  setAdapters,
  LogLevel,
  setLogger,
};
