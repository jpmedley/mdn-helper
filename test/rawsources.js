// Copyright 2022 Google LLC
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
const { initiateLogger } = require('../log.js');
const { SourceRecord } = require('../rawsources.js');

initiateLogger();

const IDL = '[\n  RuntimeEnabled=RTEExperimental\n] interface InterfaceFlagOT {\n  readonly attribute FontFaceSetLoadStatus status;\n};';

describe('SourceRecord', () => {
  describe('flagStatus', () => {
    it('Confirms that a flag\'s status correctly returned', () => {
      const sr = new SourceRecord('interfaceFlagOT', 'interface', {
        path: 'some/fake/path.idl',
        content: IDL
      });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'experimental');
    });
  });
});