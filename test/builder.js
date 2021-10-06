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

global.__commandName = 'test';

const assert = require('assert');
const fs = require('fs');

const { IDLBuilder } = require('../builder.js');
const { InterfaceData } = require('../interfacedata.js');
const path = require('path');
const utils = require('../utils.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

const BURNABLE = './test/files/burnable.idl';

const tempFolder = path.join(__dirname, 'tmp');

describe('IDLBuilder', () => {
  describe('build()', () => {

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms writing of only a BCD file', async () => {
      const source = utils.getIDLFile(BURNABLE, true);
      const id = new InterfaceData(source);
      // outpath needed to not drop junk files in random locations
      const idB = new IDLBuilder({
        bcdPath: tempFolder,
        interfaceData: id,
        jsonOnly: true,
        outPath: tempFolder
      });
      await idB.build('always');
      const contents = fs.readdirSync(tempFolder, {withFileTypes: true});
      const jsonFile = contents.find(c => {
        return c.name === 'Burnable.json';
      });
      assert.strictEqual(jsonFile.name, 'Burnable.json');
    });

    it('Confirms writing of only an interface page', async () => {
      const source = utils.getIDLFile(BURNABLE, true);
      const id = new InterfaceData(source);
      // outpath needed to not drop junk files in random locations
      const idB = new IDLBuilder({
        bcdPath: tempFolder,
        interfaceData: id,
        interfaceOnly: true,
        outPath: tempFolder
      });
      await idB.build('always');
      const interfacePage = path.join(tempFolder, 'burnable');
      const contents = fs.readdirSync(interfacePage, {withFileTypes: true});
      assert.strictEqual(contents.length, 1);
    });

    afterEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
    });
  });
});