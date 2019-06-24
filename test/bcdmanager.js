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
const Validator = require('jsonschema').Validator;

const { BCDManager } = require('../bcdmanager.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');

// https://www.npmjs.com/package/diff

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}

describe('BCDManager', () => {
  describe('getBCD()', () => {
    const tempFolder = 'tmp/';
    const jsonPath = `${tempFolder}test-bcd.json`;

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that a BCD file is written', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager();
      const resultPath = bcdManager.getBCD(id, jsonPath);
      assert.ok(fs.existsSync(resultPath));
    });

    it('Confirms that the written BCD file is valid', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager();
      const resultPath = bcdManager.getBCD(id, jsonPath);
      let buffer = fs.readFileSync('test/files/compat-data.schema.json');
      const schema = [buffer.toString()];
      buffer = fs.readFileSync(resultPath);
      const result = JSON.parse(buffer.toString()).api;
      const validator = new Validator();
      console.log(validator.validate(result, schema));
    })

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });
});