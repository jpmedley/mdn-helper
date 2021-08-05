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

const { EMPTY_BURN_DATA } = require('../interfacedata.js');
const { Pinger } = require('../pinger.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('Pinger', () => {
  describe('pingRecords', () => {
    it('Returns true when the record\'s url is found', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/Event'
      record.type = "reference"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      return pinger.pingRecords(false)
      .then(records => {
        assert.ok(records[0].mdn_exists);
      });
    });

    it('Returns false when the record\'s page does not exist', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/TransitionEvent/wonderful'
      record.type = "property"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      return pinger.pingRecords(false)
      .then(records => {
        assert.strictEqual(records[0].mdn_exists, false);
      })
    })
  });
});