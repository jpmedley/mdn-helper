'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const { InterfaceData } = require('./idl.js');
const { Builder } = require('./app_Builder.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

const NOTHING_FOUND = "Could not find matching IDL files."

class _Finder {
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
      names.push(matches[m].key);
    }
    let enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('idlFile', 'Which interface do you want to write for?', {
      type: 'checkbox',
      checkbox: radio.star,
      choices: names
    });
    let answers = await enq.prompt('idlFile');
    return answers;
  }

  async findAndShow(args) {
    const matches = this._find(args[3]);
    const answers = await this._select(matches);
    let idlPath, idlFile, name, match;
    for (let a of answers.idlFile) {
      for (let m of matches) {
        if (a.includes(m.key)) {
          match = m;
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
    const matches = this._find(args[3]);
    const answers = await this._select(matches);
    let interfaces = [];
    for (let m in matches) {
      if (answers.idlFile.includes(matches[m].key)) {
        interfaces.push(matches[m]);
      }
    }
    const id = new InterfaceData(interfaces[0]);
    const builder = new Builder();
    builder.writeBCD(id);
    builder.build(id.command);
    // builder.build(id);
  }

}

module.exports.Finder = _Finder;
