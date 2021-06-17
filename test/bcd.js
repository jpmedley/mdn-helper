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

const { bcd } = require('../bcd.js')
global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('BCD', () => {
  describe('getByKey()', () => {
    it('Confirms that null is returned for a fictitious key', () => {
      assert.strictEqual(bcd.getByKey('Medley'), null);
    });

    it('Confirms that a tree is returned for a real value', () => {
      assert.notStrictEqual(bcd.getByKey('Request'), null);
    });
  });

  describe('getRecordByKey()', () => {
    it('Confirms that a constructed URL is returned when one is missing from BCD', () => {
      let found = bcd.getRecordByKey('Medley');
      assert.strictEqual(found.mdn_url, 'https://developer.mozilla.org/en-US/docs/Web/API/Medley');
    });
    it('Confirms that a multipart key is correctly converted to a URL', () => {
      let found = bcd.getRecordByKey('Medley.joe');
      assert.strictEqual(found.mdn_url, 'https://developer.mozilla.org/en-US/docs/Web/API/Medley/joe');
    });
  });
});