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
      // Element/getAttribute
      const pops = new Popularities('/API');
      const rating = pops.getRating('/Element/getAttribute');
      console.log("RATING = " + (typeof rating));
      // process.exit();
      // assert.ok(typeof rating === 'number');})
    });
  });

  describe('source', () => {
    it('Verifies download and parse of popularities data', () => {
      const pops = new Popularities();
      assert.ok(pops.rawData);
    });
    it('Verifies filtering of data during parse', () => {
      const pops = new Popularities('/API');
      const items = pops.rawData;
      const remains = items.filter(f => {
        return (!f.includes('/API'));
      });
      assert.strictEqual(remains.length, 0);
    });
  });
});
