'use strict';

const assert = require('assert');

const { FlagStatus } = require('../flags.js');

const FLAG_FILE = './test/files/test_flags.json5';

const flags = FlagStatus(FLAG_FILE);

describe('FlagStatus', () => {
  it('Returns true.', () => {
    assert.equal(flags['RTEExperimental'], 'experimental');
  });
});