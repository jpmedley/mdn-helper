'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const { InterfaceData } = require('./idl.js');
const { Builder } = require('./app_Builder.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

const NOTHING_FOUND = "Could not find matching IDL files."
const CANCEL = '(none)';

class _Finder {
  constructor() {
    this.idlSet = new fm.IDLFileSet();
  }

  async _confirm(message) {
    let enq = new Enquirer();
    const options = {
      message: (message + ' Y or N?'),
      validate: (value) => {
        if (!['y','Y','n','N'].includes(value)) {
          return "Please enter one of 'y','Y','n', or 'N'";
        } else {
          value = value.toLowerCase();
          return true;
        }
      }
    };
    enq.question('confirm', options);
    const answer = await enq.prompt('confirm');
    return answer;
  }

  _find(interfacesNamed) {
    const matches = this.idlSet.findMatching(interfacesNamed);
    if (!matches.length) {
      console.log(NOTHING_FOUND);
      process.exit();
    }
    return matches;
  }

  _isFlagged(data) {
    let message;
    let stub = 'and therefore should not be documented on MDN. Do you want to procede?'
    if (data._originTrial) {
      message = 'This interface is in an origin trial ' + stub;
    }
    if (data._flag) {
      message = 'This interface is behind a flag ';
    }
    if (data._originTrial && data._flag) {
      message = 'This interface is in an origin trial and behind a flag ' + stub;
    }
    if (message) {
      return { flagged: true, message: message }
    } else {
      return { flagged: false, message: '' }
    }
  }

  _normalizeArguments(args, mode) {
    // Remove -j if we're finding instead of building
    if (mode == 'find') {
      for (let i in args) {
        if (args[i] == '-j') {
          args.splice(i, 1);
          return args;
        }
      }
    }
    // Make sure args in the correct order
    for (let i in args) {
      if ((args[i] == '-j') && (i == (args.length-1))) {
        args.splice((args.length - 2), 0, '-j');
        args.splice((args.length - 1), 1);
        return args;
      }
    }
    return args;
  }

  async _select(matches) {
    let names = [];
    for (let m in matches) {
      names.push(matches[m].key);
    }
    names.push(CANCEL);
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
    args = this._normalizeArguments(args, 'find');
    const matches = this._find(args[args.length - 1]);
    const answers = await this._select(matches);
    if (answers.idlFile[0] == CANCEL) { process.exit(); }
    let idlPath, idlFile, name, match;
    for (let a of answers.idlFile) {
      for (let m of matches) {
        if (a == m.key) {
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
    args = this._normalizeArguments(args, 'build');
    const matches = this._find(args[args.length - 1]);
    const answers = await this._select(matches);
    if (answers.idlFile[0] == CANCEL) { process.exit(); }
    let interfaces = [];
    for (let m in matches) {
      if (answers.idlFile.includes(matches[m].key)) {
        interfaces.push(matches[m]);
      }
    }
    const id = new InterfaceData(interfaces[0]);
    const flagged = this._isFlagged(id);
    if (flagged.flagged) {
      const answer = await this._confirm(flagged.message);
      if (answer.confirm == 'n') { process.exit(); }
    }
    const builder = new Builder();
    builder.writeBCD(id);
    // Remimplement and add to help after conversion to yargs.
    if (!args.includes('-j')) {
      //The j flag means json only.
      builder.build(id.command);
    }
  }

}

module.exports.Finder = _Finder;
