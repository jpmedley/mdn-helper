'use strict';

const assert = require('assert');

const { FlagStatus } = require('../flags.js');

const FLAG_FILE = './test/files/exp_flags.json5';

const flags = FlagStatus(FLAG_FILE);

describe('FlagStatus', () => {
  it('Returns true when the passed flag returns "experimental"', () => {
    assert.equal(flags['RTEExperimental'], 'experimental');
  });
});