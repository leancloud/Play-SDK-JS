export default class PlayError {
  constructor(code, detail) {
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
