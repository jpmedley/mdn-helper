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

const { CSSBuilder, IDLBuilder } = require('../builder.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

const BURNABLE = './test/files/burnable.idl';

const tempFolder = 'tmp/';

describe('CSSBuilder', () => {
  describe('build()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that a CSS property page is written', () => {

    });

    it('Confirms that BCD is written to a file', () => {
      
    });

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  })
})

describe('IDLBuilder', () => {
  describe('build()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that BCD is written to a file', () => {
      const source = utils.getIDLFile(BURNABLE, true);
      const id = new InterfaceData(source);
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