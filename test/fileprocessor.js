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
const glob = require("glob");

const { IDLError } = require('../errors.js');
const { FileProcessor } = require('../fileprocessor.js');

const ACTUAL_IDL_FILES = 'idl/**/**/**/*.idl';
const TEST_IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('FileProcessor', () => {
  describe('process()', () => {
    it('Confirms that interface structures can be interpreted in all IDL files', () => {
      const foundFiles = glob.sync(ACTUAL_IDL_FILES);
      let foundErr ='';
      foundFiles.forEach((f) => {
        if (f.includes('testing/')) { return; }
        try {
          const fp = new FileProcessor(f);
          fp.process((result) => {
            // result not needed for this test.
          });
        } catch (err) {
          foundErr = err;
          console.log(err.message)
        }
      });
      assert.ok(!(foundErr instanceof IDLError));
    })
    it('Confirms that the four interface data objects are in the resulting fileset', () => {
      const testFile = `${TEST_IDL_FILES}multiple-structures.idl`;
      const fp = new FileProcessor(testFile);
      let interfaceNames = [];
      fp.process((result) => {
        interfaceNames.push(result.name);
      });
      let msg = `Found interfaces are: ${interfaceNames}.`
      assert.strictEqual(interfaceNames.length, 4);
    });
    it('Confirms that standard interfaces are read', () => {
      const testFile = `${TEST_IDL_FILES}burnable.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        iface = result;
      });
      assert.strictEqual(iface.name, 'Burnable');
    });
    it('Confirms that callback interfaces are read', () => {
      const testFile = `${TEST_IDL_FILES}interface-callback.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        iface = result;
      });
      assert.strictEqual(iface.name, 'InterfaceCallback');
    });
    it('Confirms that callback functions are read', () => {
      const testFile = `${TEST_IDL_FILES}callback.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        if (result.type === 'callback') {
          iface = result;
        }
      });
      assert.strictEqual(iface.name, 'DecodeErrorCallback');
    });
    it('Confirms that dictionaries are read', () => {
      const testFile = `${TEST_IDL_FILES}dictionary.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        if (result.type === 'dictionary') {
          iface = result;
        }
      });
      assert.strictEqual(iface.name, 'USBDeviceFilter');
    });
    it('Confirms that a single enum is read', () => {
      const testFile = `${TEST_IDL_FILES}enum.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        if (result.type === 'enum') {
          iface = result;
        }
      });
      assert.strictEqual(iface.name, `AudioContextState`);
    });
    it('Confirms that multiple enums are read from a single file', () => {
      const testFile = `${TEST_IDL_FILES}enums.idl`;
      const fp = new FileProcessor(testFile);
      let iface = 0;
      fp.process((result) => {
        iface++;
      });
      assert.strictEqual(iface, 2);
    });
    it('Confirms that identifiers containing "enum" are ignored', () => {
      const testFile = `${TEST_IDL_FILES}alternate-key.idl`;
      const fp = new FileProcessor(testFile);
      assert.doesNotThrow(() => {
        fp.process((result) => {
          // result not needed for this test.
        });
      }, IDLError);
    });
    it('Confirms that mixin interfaces are read', () => {
      const testFile = `${TEST_IDL_FILES}mixin.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        iface = result;
      });
      assert.strictEqual(iface.name, 'Body');
    });
    it('Confirms that includes statements are read', () => {
      const testFile = `${TEST_IDL_FILES}mixin-includes.idl`;
      const fp = new FileProcessor(testFile);
      fp.process((result) => {
        if (result.type === 'includes') {
          assert.ok(result.type === 'includes');
        }
      });
    });
    it('Confirms that multiple includes statements are read', () => {
      const testFile = `${TEST_IDL_FILES}mixin-includes-multiple.idl`;
      const fp = new FileProcessor(testFile);
      let includesCount = 0;
      fp.process((result) => {
        if (result.type === 'includes') {
          includesCount++;
        }
      });
      assert.strictEqual(includesCount, 2);
    })
    it('Confirms that partial interfaces are read', () => {
      const testFile = `${TEST_IDL_FILES}interface-partial.idl`;
      const fp = new FileProcessor(testFile);
      let iface;
      fp.process((result) => {
        iface = result;
      });
      assert.strictEqual(iface.name, 'InterfacePartial');
    });
  });
});
