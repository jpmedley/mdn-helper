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
const CONSTRUCTOR = {
  name: 'constructor',
  path: function() { return './test/files/constructor-noarguments.idl'; }
}
const EXPERIMENTAL = {
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
  path: function() { return './test/files/ping-exists.idl'; }
}
const PING_MISSING = {
  name: 'pingMissing',
  path: function() { return './test/files/ping-missing.idl'; }
}
const SECURE_CONTEXT = {
  name: 'secureContext',
  path: function() { return './test/files/securecontext.idl'; }
}
const STABLE = {
  name: 'stable',
  path: function() { return './test/files/interface-rte-stable.idl'; }
}
const TEST = {
  name: 'test',
  path: function() { return './test/files/interface-rte-test.idl'; }
}
const UNFAMILLIAR = {
  name: 'unfamilliarFlag',
  path: function() { return './test/files/interface-rte-medley.idl'; }
}

describe('InterfaceData', () => {
  describe('burnable', () => {
    it('Confirms that a test interface is not burnable', () => {
      const id = new InterfaceData(TEST, {});
      assert.equal(id.burnable, false);
    });
    it('Confirms that an interface with an experimental flag is burnable', () => {
      const id = new InterfaceData(EXPERIMENTAL, { experimental: true });
      assert.ok(id.burnable);
    });
    it('Confirms that an interface with an experimental flag is NOT burnable', () => {
      const id = new InterfaceData(EXPERIMENTAL, { experimental: false });
      assert.equal(id.burnable, false);
    });
    it('Confirms that an interface with a stable flag is burnable when passed experimental:false ', () => {
      const id = new InterfaceData(STABLE, { experimental: false });
      assert.ok(id.burnable);
    });
    it('Confirms that an interface with a stable flag is burnable when passed experimental:true ', () => {
      const id = new InterfaceData(STABLE, { experimental: true });
      assert.ok(id.burnable);
    });
    it('Throws when an unrecognized status is found in flags', () => {
      const id = new InterfaceData(UNFAMILLIAR, { experimental: true });
      assert.throws(
        () => { return id.burnable }, IDLFlagError
      )
    })
  });

  describe('flagged', () => {
    it('Confirms that the interface is behind a flag', () => {
      const id = new InterfaceData(EXPERIMENTAL, {
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

  describe('getBurnRecords()', () => {
    it('Cofirms that a burn record for a constructor has the type "constructor"', () => {
      const id = new InterfaceData(CONSTRUCTOR, {});
      const burnRecords = id.getBurnRecords();
      const constRecord = burnRecords.find(e => {
        return e.key === 'FontFace.FontFace';
      });
      assert.equal(constRecord.type, 'constructor');
    });
  });

  describe('getFlag()', () => {
    it('Returns experimental status for an interface when no argument is passed', () => {
      const flagged = new InterfaceData(EXPERIMENTAL, {
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

  describe('getSecureContext', () => {
    it('Returns true when the selected interface requires a secure context.', () => {
      const sc = new InterfaceData(SECURE_CONTEXT, {});
      assert.ok(sc.getSecureContext());
    });
    it('Returns false when the selected interface does not require a secure context.', () => {
      const sc = new InterfaceData(NO_FLAGS, {});
      assert.equal(sc.getSecureContext(), false);
    });
  });

  describe('signatures', () => {
    it('Returns true when the correct number of constructors is returned', () => {
      const id = new InterfaceData(BURNABLE, {});
      const signatures = id.signatures;
      assert.equal(signatures.length, 2);
    });
  });

  // describe('writeKeys()', () => {
  //   it('Returns true when the save file contains all unflagged keys', () => {
  //     const id = new InterfaceData(BURNABLE, {
  //       experimental: false,
  //       originTrial: false
  //     });

  //     const keyFile = './keyfile.txt';
  //     if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
  //     id.writeKeys(keyFile);
  //     const keyFileContents = fs.readFileSync(keyFile).toString();
  //     const keys = keyFileContents.split('\n');
  //     assert.equal(keys.length, 9);
  //     fs.unlinkSync(keyFile);
  //   });
  // });
});