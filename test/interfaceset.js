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

const { DirectoryManager } = require('../directorymanager.js');

let INTERFACE_SET;

const IDL_FILES = './test/files/';
const WHITELIST_INTERFACES = ['Burnable', 'Constructors'];
const WHITELIST_MEMBERS = ['Constructors.family'];

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('InterfaceSet', () => {

  before(() => {
    const dm = new DirectoryManager(IDL_FILES);
    INTERFACE_SET = dm.interfaceSet;
  });

  describe('findMatching', () => {
    it('Confirms return of all interfaces behind a flag', () => {
      const matches = INTERFACE_SET.findMatching("*", true);
      assert.equal(matches.length, 69);
    })
    it('Confirms return of matching items', ()=> {
      const matches = INTERFACE_SET.findMatching('Burnable');
      assert.equal(matches.length, 2);
    });
    it('Confirms flags returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', true);
      assert.ok(matches[0].flagged, 'Expected true from InterfaceData.flagged');
    });
    it('Confirms flags not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceRTE2', false);
      assert.equal(matches.length, 0);
    });
    it('Confirms origin trials returned', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, true);
      assert.ok(matches[0].originTrial, 'Expected true from InterfaceData.originTrial');
    });
    it('Confirms origin trials not returned when not requested', () => {
      const matches = INTERFACE_SET.findMatching('InterfaceOT', false, false);
      assert.equal(matches.length, 0);
    });
  });
});
