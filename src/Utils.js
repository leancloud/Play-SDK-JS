const isWeapp =
  // eslint-disable-next-line no-undef
  typeof wx === 'object' && typeof wx.connectSocket === 'function';

export default isWeapp;

// eslint-disable-next-line no-sequences
export const tap = interceptor => value => (interceptor(value), value);
export const tapError = interceptor => error => {
  interceptor(error);
  throw error;
};
