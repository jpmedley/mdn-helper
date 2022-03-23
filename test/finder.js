// Copyright 2022 Google LLC
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

global.__commandName = 'test';

const assert = require('assert');

const { IDLFinder } = require('../finder.js');

const TEST_IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('IDLFinder', () => {
  describe('find()', () => {
    it('Confirms that an interface is returned', async () => {
      const args = ['Finder', 'InterfaceNoParent'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find();
      assert.strictEqual(found[0].name, 'InterfaceNoParent');
    });

    it('Confirms that multiple, same-named items are returned', async () => {
      const args = ['Finder', 'SameName'];
      const types = ['callback', 'dictionary', 'enum', 'interface'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find(types);
      assert.strictEqual(found.length, 4);
    });

    it('Confirms that flaged items are omitted when not requested', async () => {
      const args = ['Finder', 'RTEExperimental'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find();
      assert.strictEqual(found.length, 0);
    });

    it('Confirms that flaged items are included when requested', async () => {
      const args = ['Finder', 'InterfaceRTE2', '-f'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find();
      assert.strictEqual(found.length, 1);
    });

    it('Confirms that items are found for partial strings', async () => {
      const args = ['Finder', 'All'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find();
      assert.strictEqual(found.length, 3);
    });

    it('Confirms that is case insensitive', async () => {
      const args = ['Finder', 'all'];
      const idf = new IDLFinder(args, { iDLDirectory: TEST_IDL_FILES });
      const found = await idf.find();
      assert.strictEqual(found.length, 3);
    });
  });
});