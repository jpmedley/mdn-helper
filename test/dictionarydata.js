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

const { DictionaryData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const DICTIONARY = './test/files/dictionary.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('DictionaryData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const dicrtionarySource = loadSource(DICTIONARY);
      const ds = new DictionaryData(dicrtionarySource, DICTIONARY);
      assert.strictEqual(ds.name, 'USBDeviceFilter');
    });
  });
});