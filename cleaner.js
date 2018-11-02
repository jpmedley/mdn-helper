'use strict';

const fs = require('fs');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const radio = require('radio-symbol');
const readline = require('readline');
const utils = require('./utils.js');

const prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('outputDirs', 'which output directories do you want to delete?', {
      type: 'checkbox',
      // checkbox: radio.star,
      choices: dirs
    });
    let answers = await enq.prompt('outputDirs');
    return answers;
  }

  async _clean(dirsToDelete) {
    return new Promise((resolve, reject) => {
      let q = "Are you sure? Y or N?";
      prompt.question(q, a => {
        // START HERE: Racing ahead again instead of being async.
        if (a.toLowerCase() == 'y') {
          console.log("Removing selected directories.");
          for (let d of dirsToDelete) {
            // fs.unlinkSync(utils.OUT + dir);
            console.log(`\tDeleting ${dir}`);
          }
        }
        resolve();
      });
    });
  }

  async clean() {
    let dirsToDelete = await this._select();
    await this._clean();
    console.log("Done.");
  }
}

module.exports.Cleaner = _Cleaner;
