import _debug from 'debug';

const d = _debug('Play');

/**
 * 日志级别
 */
export const LogLevel = {
  Debug: 'Debug',
  Warn: 'Warn',
  Error: 'Error',
};

const logger = {
  [LogLevel.Debug]: d,
  [LogLevel.Warn]: console.warn.bind(console),
  [LogLevel.Error]: console.error.bind(console),
};

export function setLogger(newLogger) {
  Object.assign(logger, newLogger);
}

/**
 * 调试输出
 * @ignore
 * @param {String} log
 */
export function debug(log) {
  const fullLog = `[DEBUG] ${log}`;
  logger[LogLevel.Debug](fullLog);
}

/**
 * 警告输出
 * @ignore
 * @param {String} log
 */
export function warn(log) {
  const fullLog = `[WARN] ${log}`;
  logger[LogLevel.Warn](fullLog);
}

/**
 * 错误输出
 * @ignore
 * @param {String} log
 */
export function error(log) {
  const fullLog = `[ERROR] ${log}`;
  logger[LogLevel.Error](fullLog);
}
