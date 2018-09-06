import d from 'debug';

const debug = d('Play:Play');

/**
 * 日志级别
 */
export const LogLevel = {
  Debug: 0,
  Warn: 1,
  Error: 2,
};

let logDelegate = null;

export function setLogDelegate(newLogDelegate) {
  logDelegate = newLogDelegate;
}

/**
 * 调试输出
 * @param {String} log
 */
export function _debug(log) {
  if (logDelegate !== null) {
    logDelegate(LogLevel.Debug, log);
  }
  debug(`[DEBUG] ${log}`);
}

/**
 * 警告输出
 * @param {String} log
 */
export function _warn(log) {
  if (logDelegate !== null) {
    logDelegate(LogLevel.Warn, log);
  }
  const fullLog = `[WARN] ${log}`;
  console.warn(fullLog);
  debug(fullLog);
}

/**
 * 错误输出
 * @param {String} log
 */
export function _error(log) {
  if (logDelegate != null) {
    logDelegate(LogLevel.Error, log);
  }
  const fullLog = `[ERROR] ${log}`;
  console.error(fullLog);
  debug(fullLog);
}
