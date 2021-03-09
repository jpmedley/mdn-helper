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

const { FileProcessor, IDLError } = require('../fileprocessor.js');
const { InterfaceSet } = require('../interfaceset.js');

const ACTUAL_IDL_FILES = 'idl/**/**/**/*.idl';
const TEST_IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('FileProcessor', () => {
  describe('process()', () => {
    it('Confirms that interface structures can be interpreted in all IDL files', () => {
      const foundFiles = glob.sync(ACTUAL_IDL_FILES);
      let foundErr;
      foundFiles.forEach((f) => {
        try {
          let fp = new FileProcessor(f);
          fp.process((result) => {
            // result not needed for this test.
          });
        } catch (err) {
          foundErr = err;
        }
      });
      assert.ok(!(foundErr instanceof IDLError));
    })
    it('Confirms that the four interface data objects are in the resulting fileset', () => {
      const is = new InterfaceSet();
      const testFile = `${TEST_IDL_FILES}multiple-structures.idl`;
      let fp = new FileProcessor(testFile);
      fp.process((result) => {
        is.add(result);
      });
      let msg = `Found interfaces are: ${is.interfaceNames}.`
      assert.equal(is.count, 2, msg);
    });
    it('Confirms that partial interfaces are handled', () => {
      const is = new InterfaceSet();
      const testFile = `${TEST_IDL_FILES}interface-partial.idl`;
      let fp = new FileProcessor(testFile);
      fp.process((result) => {
        is.add(result);
      });
      const ifs = is.interfaces;
      assert.equal(ifs[0].name, "InterfacePartial");
    });
    it('Confirms that callback interfaces are handled', () => {
      const is = new InterfaceSet();
      const testFile = `${TEST_IDL_FILES}interface-callback.idl`;
      let fp = new FileProcessor(testFile);
      fp.process((result) => {
        is.add(result);
      });
      const ifs = is.interfaces;
      assert.equal(ifs[0].name, "InterfaceCallback");
    });
  });
});
