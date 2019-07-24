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

const { IDLBuilder } = require('../builder.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');


const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}

const tempFolder = 'tmp/';
const jsonPath = `${tempFolder}test-bcd.json`;

describe('IDLBuilder', () => {
  describe('build()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that BCD is written to a file', () => {
      const id = new InterfaceData(BURNABLE);
      const idB = new IDLBuilder({
        interfaceData: id,
        jsonOnly: true,
        outPath: tempFolder,
        verbose: false
      });
      idB.build();
      assert.ok(fs.existsSync(tempFolder));
    });

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });
});