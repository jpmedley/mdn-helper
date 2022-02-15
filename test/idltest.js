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

const { ChromeIDLSource } = require('../sourceprocessor.js');
const { IDLError } = require('../errors.js');

const IDL_FILES = './idl/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('ChromeIDLSource: IDL Test', () => {
  describe('getFeatureSources()', () => {
    it ('Processes latest idl files to confirm there are no errent structures', () => {
      const cis = new ChromeIDLSource(IDL_FILES);
      try {
        const sources = cis.getFeatureSources();
      } catch (error) {
        assert.fail(error.message);
      }
      assert.ok(true);
    });
  });
});