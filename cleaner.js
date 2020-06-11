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

const fs = require('fs');
const cb = require('prompt-checkbox');
const { MultiSelect } = require('enquirer');
const utils = require('./utils.js');

const CANCEL = '(cancel)';

class _Cleaner {
  constructor() {
    this._directories = this._getDirList();
  }

  _getDirList() {
    const dirContents = fs.readdirSync(utils.OUT, {withFileTypes: true});
    let newList = [];
    for (let d of dirContents) {
      if (d.isDirectory()) { newList.push(d); }
    }
    return newList;
  }

  async _select() {
    let dirs = [];
    for (let d of this._directories) { dirs.push(d.name); }
    dirs.push(CANCEL);
    const prompt = new MultiSelect({
      name: 'cleanList',
      message: 'Which output directories do you want to delete?',
      choices: dirs,
      validate: (v) => {
        if (v.length === 0) {
          let msg = "Use arrows to move and the space bar to select. ";
          msg += "You must choose one or more\n  items or '(cancel)' to abandon.";
          return msg;
        }
        if (v.length > 1 && v.includes(CANCEL)) {
          return "Selected items cannot include (cancel). Use the space bar to unselect.";
        }
        return true;
      }
    });
    const answers = await prompt.run();
    return answers;
  }

  async _clean(dirsToDelete) {
    const answer = await utils.confirm("Are you sure?");
    if (answer) {
      console.log("\nRemoving selected directories.");
      for (let d in dirsToDelete) {
        console.log(`\tDeleting ${dirsToDelete[d]}.`);
        utils.deleteUnemptyFolder(utils.OUT + dirsToDelete[d]);
      }
      console.log('\n');
    } else {
      console.log('Will not delete selected directories.\n');
    }

  }

  async clean() {
    let dirsToDelete = await this._select();
    if (dirsToDelete.includes(CANCEL)) {
      const msg = '\nAbandoning cleaning operation as requested.\n';
      console.log(msg);
      return;
    }
    await this._clean(dirsToDelete);
  }
}

module.exports.Cleaner = _Cleaner;
