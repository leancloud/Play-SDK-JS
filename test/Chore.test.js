import queryString from 'query-string';

const { expect } = require('chai');
const debug = require('debug')('Test:Chore');

describe('chore test', () => {
  it('parse url', () => {
    const parsed = queryString.parseUrl('https://foo.bar?foo=bar');
    debug(JSON.stringify(parsed));
    const { url, query } = parsed;
    expect(url).to.be.equal('https://foo.bar');
    expect(query.foo).to.be.equal('bar');
  });
});
