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

  _find(interfacesNamed) {
    const matches = this.idlSet.findMatching(interfacesNamed);
    let names = [];
    for (let m in matches) {
      names.push(matches[m].name)
    }
    return { matches, names};
  }

  list(interfacesNamed) {
    const found = this._find(interfacesNamed);
    for (let n in found.names) {
      console.log(found.names[n]);
    }
  }

  async _select(interfacesNamed) {
    const names = this._find(interfacesNamed);
    let enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('idlFile', 'For which IDL file do you want to create MDN pages?', {
      type: 'checkbox',
      checkbox: radio.star,
      choices: names
    });
    let answers = await enq.prompt('idlFile')
    return answers;
  }

  async findAndBuild(interfacesNamed) {
    const names = this._find(interfacesNamed);
    let enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('idlFile', 'For which IDL file do you want to create MDN pages?', {
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
