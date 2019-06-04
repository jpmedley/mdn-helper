'use string';

const assert = require('assert');
const fs = require('fs');

const { BCD } = require('../bcd.js');
const { URL } = require('url');

const { InterfaceData, IDLFlagError } = require('../interfacedata.js');

global._bcd = new BCD();
global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

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
const NO_FLAGS = {
  name: 'noFlags',
  path: function() { return './test/files/interface-noinherits.idl'; }
}
const ORIGIN_TRIAL = {
  name: 'originTrial',
  path: function() { return './test/files/interface-origintrial.idl'; }
}
const PING_EXISTS = {
  name: 'pingExists',
  path: function() { return './test/files/ping-exists.idl'}
}
const PING_MISSING = {
  name: 'pingMissing',
  path: function() { return './test/files/ping-missing.idl'}
}
const STABLE = {
  name: 'stable',
  path: function() { return './test/files/interface-rte-stable.idl'; }
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

    it('Does not throw when a complete interface has no flags', () => {
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

  describe('getFlag()', () => {
    it('Returns experimental status for an interface when no argument is passed', () => {
      const flagged = new InterfaceData(FLAGGED, {
        experimental: true
      });
      assert.equal(flagged.getFlag(), 'experimental');
    });
    it('Returns stable status for an interface when no argument is passed', () => {
      const stable = new InterfaceData(STABLE, {
        experimental: true
      });
      assert.equal(stable.getFlag(), 'stable');
    });
  });

  describe('getKeys()', () => {
    //To Do: Need separate tests for iterable, maplike, read-only maplike, and setlike
    const id = new InterfaceData(BURNABLE, {
      experimental: true
    });
    it('Confirms that the returned keys contain all members', () => {
      assert.equal(id.getkeys().length, 8);
    });
    it('Confirms that the returned keys contain no flagged or OT members', () => {
      assert.equal(id.getkeys(true).length, 5);
    });
    it('Confirms that returned keys contains a properly formatted conststructor key', () => {
      const keys = id.getkeys();
      let valid = false;
      for (let k of keys) {
        if (k === 'MedleyFace.MedleyFace') {
          valid = true;
          break;
        }
      }
      assert.ok(valid);
    });
    it('Confirms that returned keys contains only one conststructor key', () => {
      const keys = id.getkeys();
      let keyCount = 0;
      for (let k of keys) {
        if (k.includes('MedleyFace.MedleyFace')) {
          keyCount++;
        }
      }
      assert.equal(keyCount, 1);
    });
    it('Confirms that all returned keys are not objects', () => {
      const keys = id.getkeys();
      let valid = true;
      for (let k of keys) {
        if (k.includes('[object Object]')) {
          valid = false;
          break;
        }
      }
      assert.ok(valid);
    });
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

  describe('ping()', () => {
    it('Confirms the existence of MDN pages for provided URLs', () => {
      const id = new InterfaceData(PING_EXISTS, {});
      id.ping(false)
      .then(burnRecords => {
        assert.ok(burnRecords[0].mdn_exists);
      });
    });

    it('Refutes the existence of MDN pages for provided URLs', () => {
      const id = new InterfaceData(PING_MISSING, {});
      id.ping(false)
      .then(burnRecords => {
        assert.equal(burnRecords[0].mdn_exists, false);
      });
    });
  });

  describe('signatures', () => {
    it('Returns true when the correct number of constructors is returned', () => {
      const id = new InterfaceData(BURNABLE, {});
      const signatures = id.signatures;
      assert.equal(signatures.length, 2);
    });
  });

  describe('writeKeys()', () => {
    it('Returns true when the save file contains all unflagged keys', () => {
      const id = new InterfaceData(BURNABLE, {
        experimental: false,
        originTrial: false
      });

      const keyFile = './keyfile.txt';
      if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
      id.writeKeys(keyFile);
      const keyFileContents = fs.readFileSync(keyFile).toString();
      const keys = keyFileContents.split('\n');
      assert.equal(keys.length, 9);
      fs.unlinkSync(keyFile);
    });
  });
});