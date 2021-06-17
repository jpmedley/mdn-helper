// Copyright 2021 Google LLC
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

const { Popularities } = require('../popularities.js');

describe('Popularities', () => {
  describe('getRating()', () => {
    it('Verifies that a number is returned', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const rating = pops.getRating('/Element/getAttribute');
      assert.ok(typeof rating === 'number');
    });
    it('Verifies 0 is returned if no value is found', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const rating = pops.getRating('/Element/getJoe');
      assert.strictEqual(rating, 0);
    });
  });

  describe('source', () => {
    it('Verifies download and parse of popularities data', () => {
      const pops = new Popularities();
      assert.ok(pops.rawData.length > 0);
    });
    it('Verifies filtering of data during parse', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      const items = pops.rawData;
      const remains = items.filter(f => {
        return (!f.includes('/API'));
      });
      assert.ok(remains.length === 0);
    });
    it('Verifies the reading of popularities.json from a specified path', () => {
      const pops = new Popularities('/API', { source: 'test/files/popularities.json' });
      assert.ok(pops.rawData.length > 0);
    });
  });
});
