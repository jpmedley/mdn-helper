'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

class _Directory {
  constructor() {
    this.idlSet = new fm.IDLFileSet();
  }

  async findAndSelect(interfaceNamed) {
    const matches = this.idlSet.findMatching(interfaceNamed);
    let names = [];
    for (let m in matches) {
      names.push(matches[m].name)
    }
    let enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('idlFile', 'Which IDL file?', {
      type: 'checkbox',
      checkbox: radio.star,
      choices: names
    });
    let answers = await enq.prompt('idlFile')
    let interfaces = [];
    for (let m in matches) {
      if (answers.idlFile.includes(matches[m].name)) {
        interfaces.push(matches[m]);
      }
    }
    return interfaces;
  }

}

module.exports.Directory = _Directory;
