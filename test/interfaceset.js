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

const { FileProcessor } = require('../fileprocessor.js');
const { InterfaceSet } = require('../interfaceset.js');

let INTERFACE_SET = new InterfaceSet();

const IDL_FILES = './test/files/';

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('InterfaceSet', () => {

  before(() => {
    const contents = fs.readdirSync(IDL_FILES, {withFileTypes: true});
    for (const c of contents) {
      if (!c.isFile()) { continue; }
      if (!c.name.endsWith('.idl')) { continue; }
      let fp = new FileProcessor(`${IDL_FILES}${c.name}`);
      fp.process((interfaceObect) => {
        INTERFACE_SET.add(interfaceObect);
      });
    }
  });

  describe('findMatching', () => {
    it('Confirms inclusion of interfaces behind a flag', () => {
      const matches = INTERFACE_SET.findMatching("*", true);
      assert.strictEqual(matches.length, 86);
    })
    it('Confirms return of matching items', ()=> {
      const matches = INTERFACE_SET.findMatching('Burnable');
      assert.strictEqual(matches.length, 2);
    });
    it('Confirms flags returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', true);
      assert.ok(matches[0].flagged, 'Expected true from InterfaceData.flagged');
    });
    it('Confirms flags not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', false);
      assert.strictEqual(matches.length, 0);
    });
    it('Confirms origin trials returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, true);
      assert.ok(matches[0].originTrial, 'Expected true from InterfaceData.originTrial');
    });
    it('Confirms origin trials not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, false);
      assert.strictEqual(matches.length, 0);
    });
    it('Confirms a mixin is returned under its implementor\'s name', () => {
      const matches = INTERFACE_SET.findMatching('MixinIncludes', false, false);
      assert.strictEqual(matches.length, 2);
    })
  });
});
