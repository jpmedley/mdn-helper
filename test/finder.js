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
const { find } = require('shelljs');

const { Finder } = require('../finder.js');

const TEST_IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('IDLFinder', () => {
  describe('findAndReturn()', () => {
    it('Confirms return of a mixin interface as itself', (done) => {
      const searchString = ["", "MixinIncludes"];
      let finder = new Finder(searchString, { iDLDirectory: TEST_IDL_FILES });
      finder.findAndReturn()
      .then(ids => {
        const id = ids.find(i => {
          return (i.name === 'MixinIncludes');
        });
        assert.strictEqual(id.name, 'MixinIncludes');
        // done();
        this.timeout(15000);
        setTimeout(done, 12000);
      });
    });

    it('Confirms return of a mixin on the implementing interface', (done) => {
      const searchString = ["", "Including"];
      let finder = new Finder(searchString, { iDLDirectory: TEST_IDL_FILES });
      finder.findAndReturn()
      .then(ids => {
        const id = ids.find(i => {
          return (i.name === 'Including');
        });
        assert.strictEqual(id.name, 'Including');
        done();
      });
    });
  });
});