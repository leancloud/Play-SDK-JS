const isWeapp =
  // eslint-disable-next-line no-undef
  typeof wx === 'object' && typeof wx.connectSocket === 'function';

export default isWeapp;
