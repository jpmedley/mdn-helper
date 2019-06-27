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

const { BCDEditor } = require('../bcdeditor.js');

describe('BCDEditor()', () => {
  describe('updateValues()', () => {
    it('Confirms that the BCD\'s interface level is updated', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });

    it('Confirms that the BCD\'s constructor data is updated', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });

    it('Confirms that an existing BCD member entry is updated', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });

    it('Confirms that a BCD entry is created if one does not exist', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });

    it('Confirms that a constructor is inserted if one does not exist', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });

    it('Confirms that an interface member is inserted if one does not exist', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDBuilder(id, 'api', {verbose: false});

    });
  });
})