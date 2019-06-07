'use strict';

const assert = require('assert');
const { FlagStatus, NO_FLAG } = require('../flags.js');
global.__Flags = new FlagStatus('./test/files/exp_flags.json5');

describe('FlagStatus', () => {
  describe('getActualStatus()', () => {
    it('Confirms that a specified flag returns "experimental"', () => {
      assert.equal(global.__Flags.getActualStatus('RTEExperimental'), 'experimental');
    });
    it(`Confirms that ${NO_FLAG} is returned when key is not in JSON file`, () => {
      assert.equal(global.__Flags.getActualStatus('RTENotInJSON'), NO_FLAG);
    });
    it(`Confirms that a present flag with no status returns ${NO_FLAG}`, () => {
      assert.equal(global.__Flags.getActualStatus('RTENoStatus'), NO_FLAG);
    });
  })

  describe('getHighestResolvedStatus()', () => {
    it('Confirms that a key returns "experimental" on flag object', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEDefault'), 'experimental');
    });
    it ('Confirms that a key returns "experimental" on a simple flag', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEExperimental'), 'experimental');
    });
    it('Confirms that "stable" is returned when key is not in JSON file', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTENotInJSON'), 'stable');
    });
    it('Confirms that a present flag with no status returns "stable"', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTENoStatus'), 'stable');
    });
    it('Confirmst that "stable" is returned when flag object values are mixed', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEMixed'), 'stable');
    })
  })
});