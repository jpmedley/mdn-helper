// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');
const webidl2 = require('webidl2');

const { BCD } = require('../bcd.js');
const { InterfaceData, IDLFlagError } = require('../interfacedata.js');

const BURNABLE = './test/files/burn-records.idl';
const CONSTRUCTOR = './test/files/constructor-noarguments.idl';
const EXPERIMENTAL = './test/files/interface-runtimeenabled.idl';
const METHODS = './test/files/methods.idl';
const NO_FLAGS = './test/files/interface-noinherits.idl';
const ORIGIN_TRIAL = './test/files/interface-origintrial.idl';
const PING_EXISTS = './test/files/ping-exists.idl';
const PING_MISSING = './test/files/ping-missing.idl';
const PROPERTIES = './test/files/properties.idl';
const SECURE_CONTEXT = './test/files/interface-securecontext.idl';
const STABLE = './test/files/interface-rte-stable.idl';
const TEST = './test/files/interface-rte-test.idl';
const UNFAMILLIAR = './test/files/interface-rte-medley.idl';

global._bcd = new BCD();
global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

function loadTree(sourcePath) {
  const contents = utils.getIDLFile(sourcePath);
  return webidl2.parse(contents);
}

describe('InterfaceData', () => {
  describe('burnable', () => {
    it('Confirms that a test interface is not burnable', () => {
      const source = loadTree(TEST);
      const id = new InterfaceData(source[0]);
      assert.equal(id.burnable, false);
    });
    it('Confirms that an interface with an experimental flag is burnable', () => {
      const source = loadTree(EXPERIMENTAL);
      const id = new InterfaceData(source[0]);
      assert.ok(id.burnable);
    });
    it('Confirms that an interface with an experimental flag is NOT burnable', () => {
      const source = loadTree(EXPERIMENTAL);
      const id = new InterfaceData(source[0]);
      assert.equal(id.burnable, false);
    });
    it('Confirms that an interface with a stable flag is burnable when passed experimental:false ', () => {
      const source = loadTree(STABLE);
      const id = new InterfaceData(source[0]);
      assert.ok(id.burnable);
    });
    it('Confirms that an interface with a stable flag is burnable when passed experimental:true ', () => {
      const source = loadTree(STABLE);
      const id = new InterfaceData(source[0]);
      assert.ok(id.burnable);
    });
    it('Throws when an unrecognized status is found in flags', () => {
      const source = loadTree(UNFAMILLIAR);
      const id = new InterfaceData(source[0]);
      assert.throws(
        () => { return id.burnable }, IDLFlagError
      )
    })
  });

  describe('flagged', () => {
    it('Confirms that the interface is behind a flag', () => {
      const source = loadTree(EXPERIMENTAL);
      const id = new InterfaceData(source[0]);
      assert.ok(id.flagged);
    });
    it('Returns false when a whole interface is not behind the experimental flag', () => {
      const source = loadTree(NO_FLAGS);
      const id = new InterfaceData(source[0]);
      assert.equal(id.flagged, false);
    });
    it('Returns false when the flag file value is "stable".', () => {
      const source = loadTree(STABLE);
      const id = new InterfaceData(source[0]);
      assert.equal(id.flagged, false);
    });
  });

  describe('getBurnRecords()', () => {
    it('Cofirms that a burn record for a constructor has the type "constructor"', () => {
      const source = loadTree(CONSTRUCTOR);
      const id = new InterfaceData(source[0]);
      const burnRecords = id.getBurnRecords();
      const constRecord = burnRecords.find(e => {
        return e.key === 'ConstructorNoArgs.ConstructorNoArgs';
      });
      assert.equal(constRecord.type, 'constructor');
    });
  });

  describe('getFlag()', () => {
    it('Returns experimental status for an interface when no argument is passed', () => {
      const source = loadTree(EXPERIMENTAL);
      const flagged = new InterfaceData(source[0]);
      assert.equal(flagged.getFlag(), 'experimental');
    });
    it('Returns stable status for an interface when no argument is passed', () => {
      const source = loadTree(STABLE);
      const stable = new InterfaceData(source[0]);
      assert.equal(stable.getFlag(), 'stable');
    });
  });

  describe('getkeys()', () => {
    //To Do: Need separate tests for iterable, maplike, read-only maplike, and setlike
    const source = loadTree(BURNABLE);
    const id = new InterfaceData(source[0]);
    it('Confirms that the returned keys contain all members', () => {
      assert.equal(id.getkeys().length, 8);
    });
    it('Confirms that the returned keys contain no flagged or OT members', () => {
      assert.equal(id.getkeys(true).length, 5);
    });
    it('Confirms that returned keys contains the interface name as a separate item', () => {
      const keys = id.getkeys();
      assert.ok(keys.includes('Burnable'));
    })
    it('Confirms that returned keys contains a properly formatted constructor key', () => {
      const keys = id.getkeys();
      assert.ok(keys.includes('Burnable.Burnable'));
    });
    it('Confirms that returned keys contains only one constructor key', () => {
      const keys = id.getkeys();
      let keyCount = 0;
      for (let k of keys) {
        if (k.includes('Burnable.Burnable')) {
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

  describe('getSecureContext', () => {
    it('Returns true when the selected interface requires a secure context', () => {
      const source = loadTree(SECURE_CONTEXT);
      const sc = new InterfaceData(source[0]);
      assert.ok(sc.getSecureContext());
    });
    it('Returns false when the selected interface does not require a secure context', () => {
      const source = loadTree(NO_FLAGS);
      const sc = new InterfaceData(source[0]);
      assert.equal(sc.getSecureContext(), false);
    });
  });

  describe('members', () => {
    it('Confirms that members returns all methods and properties', () => {
      const source = loadTree(BURNABLE);
      const m = new InterfaceData(source[0]);
      const members = m.members;
      const count = ((keys) => {
        let count = 0;
        for (let k of keys) {
          count++;
        }
        return count;
      })(members.keys());
      assert.equal(count, 6);
    });
  });

  describe('methods', () => {
    it('Confirms that operations (methods) are correctly read from the IDL data', () => {
      const source = loadTree(METHODS);
      const m = new InterfaceData(source[0]);
      const methods = m.methods;
      assert.equal(methods[0].body.name.value, 'check');
    });
  });

  describe('originTrial', () => {
    it('Returns true when a whole interface is in an origin trial', () => {
      const source = loadTree(ORIGIN_TRIAL);
      const id = new InterfaceData(source[0]);
      assert.ok(id.originTrial);
    });
    it('returns false when a whole interface is not in an origin trial', () => {
      const source = loadTree(NO_FLAGS);
      const id = new InterfaceData(source[0]);
      assert.equal(id.originTrial, false);
    });
  });

  describe('ping()', () => {
    it('Confirms the existence of MDN pages for provided URLs', () => {
      const source = loadTree(PING_EXISTS);
      const id = new InterfaceData(source[0]);
      id.ping(false)
      .then(burnRecords => {
        assert.ok(burnRecords[0].mdn_exists);
      });
    });

    it('Refutes the existence of MDN pages for provided URLs', () => {
      const source = loadTree(PING_MISSING);
      const id = new InterfaceData(source[0]);
      id.ping(false)
      .then(burnRecords => {
        assert.equal(burnRecords[0].mdn_exists, false);
      });
    });
  });

  describe('properties', () => {
    it('Confirms that attributes (properties) are correctly read from the IDL data', () => {
      const source = loadTree(PROPERTIES);
      const p = new InterfaceData(source[0]);
      const properties = p.properties;
      assert.equal(properties[0].name, 'status');
    })
  })

  describe('signatures', () => {
    it('Returns true when the correct number of constructors is returned', () => {
      const source = loadTree(BURNABLE);
      const id = new InterfaceData(source[0]);
      const signatures = id.signatures;
      assert.equal(signatures.length, 2);
    });
  });

  describe('writeKeys()', () => {
    it('Returns true when the save file contains all unflagged keys', function() {
      const keyFile = './keyfile.txt';
      if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile); }
      const source = loadTree(BURNABLE);


      const id = new InterfaceData(source[0]);
      id.writeKeys(keyFile);
      const keyFileContents = fs.readFileSync(keyFile).toString();
      const keys = keyFileContents.split('\n');
      fs.unlinkSync(keyFile);
      assert.equal(keys.length, 5);
    });
  });
});