'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const { InterfaceData } = require('./idl.js');
const { Manual } = require('./app_manual.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

const NOTHING_FOUND = "Could not find matching IDL files."

class _Directory {
  constructor() {
    this.idlSet = new fm.IDLFileSet();
  }

  _find(interfacesNamed) {
    const matches = this.idlSet.findMatching(interfacesNamed);
    if (!matches.length) {
      console.log(NOTHING_FOUND);
      process.exit();
    }
    return matches;
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

  async findAndShow(args) {
    if (!args[3]) { throw new Error('An argument is missing.'); }
    const matches = this._find(args[3]);
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
      idlFile = utils.getIDLFile(idlPath);
      console.log(idlFile);
      console.log("File located at " + idlPath + ".");
    }
  }

  async findAndBuild(args) {
    if (!args[3]) { throw new Error('An argument is missing.'); }
    const matches = this._find(args[3]);
    const answers = await this._select(matches);
    let interfaces = [];
    for (let m in matches) {
      if (answers.idlFile.includes(matches[m].name)) {
        interfaces.push(matches[m]);
      }
    }
    const id = new InterfaceData(interfaces[0].path());
    const manApp = new Manual(id.command);
    manApp.create();
  }

}

module.exports.Directory = _Directory;
