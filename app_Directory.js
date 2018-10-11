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

  async _select(matches) {
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
    let answers = await enq.prompt('idlFile');
    return answers;
  }

  async findAndShow(interfaceNamed) {
    const matches = this.idlSet.findMatching(interfaceNamed);
    const answers = await this._select(matches);
    let idlPath, idlFile, name, match;
    for (let a in answers.idlFile) {
      name = answers.idlFile[a];
      for (let m in matches) {
        if (matches[m].name == name) {
          match = matches[m];
          break;
        }
      }
      idlPath = match.path();
      console.log(idlPath);
      idlFile = utils.getIDLFile(idlPath);
      console.log(idlFile);
    }
  }

  async findAndBuild(interfaceNamed) {
    const matches = this.idlSet.findMatching(interfaceNamed);
    const answers = await this._select(matches);
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
