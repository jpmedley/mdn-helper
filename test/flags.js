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
const { FlagStatus, NO_FLAG } = require('../flags.js');
global.__Flags = new FlagStatus('./test/files/exp_flags.json5');

describe('FlagStatus', () => {
  describe('getActualStatus()', () => {
    it('Confirms that a specified flag returns "experimental"', () => {
      assert.equal(global.__Flags.getActualStatus('RTEExperimental'), 'experimental');
    });
    it(`Confirms that ${NO_FLAG} is returned when key is not in JSON file`, () => {
      assert.equal(global.__Flags.getActualStatus('RTENotInJSON'), NO_FLAG);
    });
    it(`Confirms that a present flag with no status returns ${NO_FLAG}`, () => {
      assert.equal(global.__Flags.getActualStatus('RTENoStatus'), NO_FLAG);
    });
  })

  describe('getStableAsBoolean()', () => {
    it('Confirms that a key returns "true" on stable flag', () => {
      assert.ok(global.__Flags.getStableAsBoolean('RTEStable'));
    });
    it('Confirms that a key returns "true" on a stable origin trial', () => {
      assert.ok(global.__Flags.getStableAsBoolean('OTEEnabled'));
    });
    it('Confirms that a key returns "false" on experimental flag', () => {
      assert.ok(!global.__Flags.getStableAsBoolean('RTEExperimental'));
    });
    it('Confirms that a key returns "true" on a experimental origin trial', () => {
      assert.ok(!global.__Flags.getStableAsBoolean('OTEExperimental'));
    });
  });

  describe('getHighestResolvedStatus()', () => {
    it('Confirms that a key returns "experimental" on flag object', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEDefault'), 'experimental');
    });
    it ('Confirms that a key returns "experimental" on a simple flag', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEExperimental'), 'experimental');
    });
    it ('Confirms that a key returns "origintrial" on an origin trial flag', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('OTEExperimental'), 'origintrial');
    })
    it('Confirms that "stable" is returned when key is not in JSON file', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTENotInJSON'), 'stable');
    });
    it('Confirms that a present flag with no status returns "stable"', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTENoStatus'), 'stable');
    });
    it('Confirmst that "stable" is returned when flag object values are mixed', () => {
      assert.equal(global.__Flags.getHighestResolvedStatus('RTEMixed'), 'stable');
    });
  });
});