import PlayError from '../src/PlayError';

const { expect } = require('chai');

describe('test PlayError', () => {
  it('test PlayError', done => {
    expect(new PlayError() instanceof PlayError).to.be.equal(true);
    done();
  });
});
