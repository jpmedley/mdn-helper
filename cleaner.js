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
const Enquirer = require('enquirer');
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
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('outputDirs', 'Which output directories do you want to delete?', {
      type: 'checkbox',
      // checkbox: radio.star,
      choices: dirs
    });
    let answers = await enq.prompt('outputDirs');
    return answers.outputDirs;
  }

  async _clean(dirsToDelete) {
    const enq = new Enquirer();
    const options = { message: "Are you sure? Y or N?" };
    enq.question('confirm', options);
    const answer = await enq.prompt('confirm');
    if (answer.confirm.toLowerCase() == 'y') {
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
