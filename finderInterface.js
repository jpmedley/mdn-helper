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

  async find() {
    const answer = await this._select();
    this._show(answer);
  }

  _show(answer) {
    let idlFile = utils.getIDLFile(`./idl/${answer.sources[0].path}`);
    utils.sendUserOutput();
    utils.sendUserOutput(idlFile);
    utils.sendUserOutput(`File located at ${answer.sources[0].path}`);
  }

  async _select() {
    const possibleMatches = await this._finder.find();
    if (possibleMatches.length === 0) {
      utils.sendUserOutput(NOTHING_FOUND);
      if (this._finder.includeFlags && this._finder.includeOriginTrials) {
        utils.sendUserOutput(TRY_RUNNING);
      }
      process.exit();
    }
    this._printInstructions();
    let choices = new Array();
    possibleMatches.forEach((p) => {
      choices.push(`${p.name} (${p.type} from ${p.sources[0].path})`);
    });
    choices.push(CANCEL);
    const prompt = new Select({
      name: 'idlFile',
      message: 'Which interface do you want to work qwith?',
      choices: choices
    });
    let answer = await prompt.run();
    if (answer === CANCEL) { process.exit(); }
    const pieces = answer.split(' ');
    const key = pieces[3].slice(0, -1).trim();
    const answerData = possibleMatches.find((p) => {
      return p.sources[0].path.includes(`${key}`);
    });
    return answerData;
  }

  _printInstructions() {
    const msg = `Use the up and down arrow to find the interface you want. Then press return.\n`
    utils.sendUserOutput(msg);
  }
}

module.exports.FinderInterface = FinderInterface;