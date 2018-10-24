import Play from './Play';
import Region from './Region';
import Room from './Room';
import Player from './Player';
import Event from './Event';
import ReceiverGroup from './ReceiverGroup';
import CreateRoomFlag from './CreateRoomFlag';
import { setAdapters } from './PlayAdapter';
import { LogLevel, setLogger } from './Logger';
import ErrorCode from './ErrorCode';
import initPlayWithAVUserSign from './plugins/AVSignUtils';

const play = new Play();

export {
  play,
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
  ErrorCode,
  initPlayWithAVUserSign,
};
