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

const { IncludesData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const MIXIN_INCLUDES = './test/files/mixin-includes.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath, { clean: true });
}

describe('IncludesData', () => {
  describe('Properties', () => {
    it('Confirms that the name property returns the correct value', () => {
      const includesSource = loadSource(MIXIN_INCLUDES);
      const sources = includesSource.split('Including');
      const options = { 
        realSource: sources[0].trim(),
        sourcePath: MIXIN_INCLUDES
      };
      const proximateSource = `Including${sources[1]}`;
      const id = new IncludesData(proximateSource, options);
      assert.strictEqual(id.name, 'Including');
    });
  });
});