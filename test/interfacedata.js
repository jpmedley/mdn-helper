'use string';

const assert = require('assert');

const { InterfaceData, IDLFlagError } = require('../interfacedata.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/test_flags.json5');

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}
const FLAGGED = {
  name: 'flagged',
  path: function() { return './test/files/interface-runtimeenabled.idl'; }
}
const FLAG_AND_OT = {
  name: 'flaggedAndOt',
  path: function() { return './test/files/interface-flag-and-ot.idl'}
}
const NO_FLAGS = {
  name: 'noFlags',
  path: function() { return './test/files/interface-noinherits.idl'; }
}
const ORIGIN_TRIAL = {
  name: 'originTrial',
  path: function() { return './test/files/interface-origintrial.idl'; }
}

describe('InterfaceData', () => {
  describe('constructor', () => {
    // To see this error, both flags and OTs must be excluded.
    it('Throws when a complete interface is marked both RuntimeEnabled and OriginTrialEnabled', () => {
      assert.throws(
        () => {
          const throws = new InterfaceData(FLAG_AND_OT, {
            experimental: false,
            originTrial: false
          });
        }, IDLFlagError
      );
    });

    it('Does not throw when a complete interface has no flags.', () => {
      assert.doesNotThrow(
        () => {
          const doesNotThrow = new InterfaceData(NO_FLAGS, {})
        }, IDLFlagError
      )
    });
  });

  describe('flagged', () => {
    it('Returns true when a whole interface is behind the experimental flag', () => {
      const id = new InterfaceData(FLAGGED, {
        experimental: true
      });
      assert.ok(id.flagged);
    });
    it('returns false when a whole interface is not behind the experimental flag', () => {
      const id = new InterfaceData(NO_FLAGS, {
        experimental: true
      });
      assert.equal(id.flagged, false);
    });
  });

  describe('keys', () => {
    const id = new InterfaceData(BURNABLE, {
      experimental: true
    });
    it('Returns true when the returned keys contain all members', () => {
      assert.equal(id.keys.length, 17);
    });
    it('Returns true when the returned keys contain no flagged or OT members', () => {
      assert.equal(id.getkeys(true).length, 9);
    })
  });

  describe('originTrial', () => {
    it('Returns true when a whole interface is in an origin trial', () => {
      const id = new InterfaceData(ORIGIN_TRIAL, {
        originTrial: true
      });
      assert.ok(id.originTrial);
    });
    it('returns false when a whole interface is not in an origin trial', () => {
      const id = new InterfaceData(NO_FLAGS, {
        originTrial: true
      });
      assert.equal(id.originTrial, false);
    });
  });
});