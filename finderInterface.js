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

const { FinderFactory, IDLFinder } = require('./finder.js');
const utils = require('./utils.js');

const { Select } = require('enquirer');

const NOTHING_FOUND = "Could not find matching IDL files.\n"
const TRY_RUNNING = "\nTry running this command with the -f or -o flags to search for items behind\nflags or in origin trials.\n";
const CANCEL = '(none)';

class FinderInterface {
  constructor(args) {
    this._finder = FinderFactory(args);
  }

  find() {
    this._select();
  }

  async _select() {
    this._printInstructions();
    const possibleMatches = await this._finder.find();
    if (possibleMatches.length === 0) {
      utils.sendUserOutput(NOTHING_FOUND);
      if (this._finder.includeFlags && this._finder.includeOriginTrials) {
        utils.sendUserOutput(TRY_RUNNING);
      }
      process.exit();
    }
    possibleMatches.forEach((p) => {
      console.log(`${p.name} (${p.type} from ${p.sources[0].path})`);
    });
  }

  _printInstructions() {
    const msg = `Use the up and down arrow to find the interface you want. Then press return.\n`
    utils.sendUserOutput(msg);
  }
}

module.exports.FinderInterface = FinderInterface;