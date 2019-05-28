'use string';

const assert = require('assert');
const fs = require('fs');

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
  path: function() { return './test/files/interface-flag-and-ot.idl'; }
}
const ITERABLE = {
  name: 'iterable',
  path: function() { return './test/files/iterable.idl'; }
}
const MAPLIKE = {
  name: 'maplike',
  path: function() { return './test/files/maplike.id'; }
}
const NO_FLAGS = {
  name: 'noFlags',
  path: function() { return './test/files/interface-noinherits.idl'; }
}
const ORIGIN_TRIAL = {
  name: 'originTrial',
  path: function() { return './test/files/interface-origintrial.idl'; }
}
const READONLY_MAPLIKE = {
  name: 'readonly-maplike',
  path: function() { return './test/files/readonly_maplike.idl'; }
}
const SETLIKE = {
  name: 'setlike',
  path: function() { return './test/files/setlike.idl'; }
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

  describe('getKeys()', () => {
    //To Do: Need separate tests for iterable, maplike, read-only maplike, and setlike
    const id = new InterfaceData(BURNABLE, {
      experimental: true
    });
    it('Returns true when the returned keys contain all members', () => {
      assert.equal(id.getkeys().length, 9);
    });
    it('Returns true when the returned keys contain no flagged or OT members', () => {
      assert.equal(id.getkeys(true).length, 5);
    });
    it('Returns true if all returned keys are valid', () => {
      const keys = id.getkeys();
      let valid = true;
      for (let k of keys) {
        if (k.includes('[object Object]')) {
          valid = false;
          break;
        }
      }
      assert.ok(valid);
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

  describe('writeKeys', () => {
    it('Returns true when the save file contains all unflagged keys', () => {
      const id = new InterfaceData(BURNABLE, {
        experimental: false,
        originTrial: false
      });

      const keyFile = './keyfile.txt';
      id.writeKeys(keyFile);
      const keyFileContents = fs.readFileSync(keyFile).toString();
      console.log(keyFileContents);
      const keys = keyFileContents.split('\n');
      assert.equal(keys.length, 18);
      fs.unlinkSync(keyFile);
    });
  });
});