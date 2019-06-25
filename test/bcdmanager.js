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

const EXPECTED_UAS = ["chrome", "chrome_android", "edge", "edge_mobile", "firefox", "firefox_android", "ie", "nodejs", "opera", "opera_android", "qq_android", "safari", "safari_ios", "samsunginternet_android", "uc_android", "uc_chinese_android", "webview_android"];

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}

describe('BCDManager', () => {
  describe('write()', () => {
    const tempFolder = 'tmp/';
    const jsonPath = `${tempFolder}test-bcd.json`;

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that a BCD file is written', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager('api', {verbose: false});
      const resultPath = bcdManager.getBCD(id, jsonPath);
      bcdManager.write(resultPath);
      assert.ok(fs.existsSync(resultPath));
    });

    it('Confirms that the written BCD file is valid', () => {
      // Write a BCD file
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager('api', {verbose: false});
      const resultPath = bcdManager.getBCD(id, jsonPath);
      bcdManager.write(resultPath);
      // Load the schema
      let buffer = fs.readFileSync('test/files/compat-data.schema.json');
      const schema = [buffer.toString()];
      // Load the new BCD file
      buffer = fs.readFileSync(resultPath);
      const burnableBCD = JSON.parse(buffer.toString()).api;
      const validator = new Validator();
      // Compare
      const result = validator.validate(burnableBCD, schema);
      assert.ok(result.errors.length === 0);
    });

    it('Confirms that the written BCD file is correctly nested', () => {
      // Write and load a BCD file
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager('api', {verbose: false});
      const resultPath = bcdManager.getBCD(id, jsonPath);
      bcdManager.write(resultPath);
      const resultString = fs.readFileSync(resultPath).toString();
      // Load a correctly-nested version of what was written and compare
      const comparisonString = fs.readFileSync('test/files/properly-nested-bcd.json').toString();
      assert.equal(resultString, comparisonString);
    });

    it('Confirms that browsers are in the correct order in a written BCD file', () => {
      // Write and load a BCD file
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager('api', {verbose: false});
      const resultPath = bcdManager.getBCD(id, jsonPath);
      bcdManager.write(resultPath);
      const resultString = fs.readFileSync(resultPath).toString();
      // Cut BCD file into lines and extract user agent names
      const bcdLines = resultString.split('\n');
      const regex = /"(\w+)":\s{/;
      let fileIncludes = [];
      for (let b of bcdLines) {
        // Record UA names as they are found 
        let matches = b.match(regex);
        if (!matches) { continue; }
        let possibleUA = matches[1];
        if (EXPECTED_UAS.includes(possibleUA)) {
          if (fileIncludes.includes(possibleUA)) { continue; }
          fileIncludes.push(possibleUA);
        }
      }
      // Test that UA names are alphabetical
      const alphabetical = [...fileIncludes];
      alphabetical.sort();
      assert.deepStrictEqual(fileIncludes, alphabetical);
    });

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });

  // describe('getBCD()', () => {

  // });
});