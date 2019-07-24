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

const { IDLFileSet } = require('../idlfileset.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

const IDL_FILES = './test/files/';

describe('IDLFileSet', () => {
  describe('files', () => {
    it('Confirms that the file set includes an interface in an origin trials', () => {
      const allFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = allFiles.files;
      const OTFound = find('interface-origintrial.idl', files);
      assert.ok(OTFound);
    });
    it('Confirms that the file set includes an interface behind a flag', () => {
      const allFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = allFiles.files;
      const RTFound = find('interface-runtimeenabled.idl', files);
      assert.ok(RTFound);
    });
    it('Confirms that the file set does not include an interface behind a flag', () => {
      const someFiles = new IDLFileSet(IDL_FILES, {
        experimental: false,
        originTrial: false
      });
      let files = someFiles.files;
      const RTNotFound = find('interface-runtimeenabled.idl', files);
      assert.equal(RTNotFound, false);
    });
    it('Confirms that all 29 test IDL files are processed', () => {
      const someFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = someFiles.files;
      assert.equal(files.length, 32);
    });
  });



  describe('writeKeys()', () => {
    it('Returns true when the save file contains all unflagged keys', () => {
      const fileSet = new IDLFileSet(IDL_FILES, {
        experimental: false,
        originTrial: false
      });
      const keyFile = './keyfile.txt';
      if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
      fileSet.writeKeys(keyFile);
      const keyFileContents = fs.readFileSync(keyFile).toString();
      const keys = keyFileContents.split('\n');
      fs.unlinkSync(keyFile);
      assert.equal(keys.length, 94);
    })
  });
});

function find(file, inFiles) {
  for (let f of inFiles) {
    if (f.name === file) {
      return true;
    }
  }
  return false;
}