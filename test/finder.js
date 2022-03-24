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
// Second value of args must be an interface name, not a flag name

describe('IDLFinder', () => {
  describe('find()', () => {
    it('Confirms that an interface is returned', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('InterfaceNoParent', types, options);
      assert.strictEqual(found[0].name, 'InterfaceNoParent');
    });

    it('Confirms that multiple, same-named items are returned', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['callback', 'dictionary', 'enum', 'interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('SameName', types, options);
      assert.strictEqual(found.length, 4);
    });

    it('Confirms that dev trial items are omitted when not requested', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('RTEExperimental', types, options);
      assert.strictEqual(found.length, 0);
    });

    it('Confirms that origin trial items are omitted when not requested', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('OTEExperimental', types, options);
      assert.strictEqual(found.length, 0);
    });

    it('Confirms that dev trial items are included when requested', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: true,
        includeOriginTrials: false
      }
      const found = await idf.find('InDevTrial', types, options);
      assert.strictEqual(found.length, 1)
    });

    it('Confirms that origin trial items are included when requested', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: true
      }
      const found = await idf.find('InOriginTrial', types, options);
      assert.strictEqual(found.length, 1)
    });

    it('Confirms that items are found for partial strings', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('All', types, options);
      assert.strictEqual(found.length, 3);
    });

    it('Confirms that is case insensitive', async () => {
      const idf = new IDLFinder(TEST_IDL_FILES);
      const types = ['interface'];
      const options = {
        includeFlags: false,
        includeOriginTrials: false
      }
      const found = await idf.find('all', types, options);
      assert.strictEqual(found.length, 3);
    });
  });
});