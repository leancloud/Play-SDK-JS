const PLAY_ERRPR = 'PlayError';

export default class PlayError extends Error {
  constructor(code, detail) {
    super(`${PLAY_ERRPR}: ${code} - ${detail}`);
    this.name = PLAY_ERRPR;
    this._code = code;
    this._detail = detail;
  }

  get code() {
    return this._code;
  }

  get detail() {
    return this._detail;
  }
}
