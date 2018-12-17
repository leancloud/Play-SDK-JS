const PLAY_ERRPR = 'PlayError';

export default class PlayError extends Error {
  constructor(code, detail) {
    super(`${PLAY_ERRPR}: ${code} - ${detail}`);
    super();
    this.name = PLAY_ERRPR;
    this.code = code;
    this.detail = detail;
  }
}
