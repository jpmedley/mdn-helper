// Copyright 2020 Google LLC
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

const { CSSSet } = require('../cssset.js');

describe('CSSSet', () => {
  describe('constructor', () => {
    it('Confirms that CSS data is loaded', () => {
      const cd = new CSSSet();
      assert.strictEqual((typeof cd.properties.parameters), 'object');
    });

    it('Confirms that deep CSS data is accessible', () => {
      const cd = new CSSSet();
      assert.strictEqual(cd.properties.data[0].name, "animation-delay");
    });
  });

  describe('findMatching', () => {
    it('Confirms something', () => {

    });
  });
});