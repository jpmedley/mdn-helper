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

const { FileProcesser } = require('../fileprocessor.js');
const { InterfaceSet } = require('../interfaceset.js');

const IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('FileProcessor', () => {
  describe('process()', () => {
    it('Confirms that the four interface data objects are in the resulting fileset', ()=> {
      const is = new InterfaceSet();
      const testFile = `${IDL_FILES}multiple-structures.idl`;
      let fp = new FileProcesser(testFile, is);
      fp.process({});
      assert.equal(is.count, 4);
    });
  });
});
