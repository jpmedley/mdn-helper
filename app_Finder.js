'use strict';

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const { InterfaceData } = require('./idl.js');
const { IDLBuilder } = require('./builder.js');
const radio = require('prompt-radio');
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

  _findInterfaces(interfacesNamed) {
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
    for (let m of matches) {
      names.push(m.key + ` (${m.name})`);
    }
    names = names.sort();
    names.push(CANCEL);
    let enq = new Enquirer();
    enq.register('radio', cb);
    enq.question('idlFile', 'Which interface do you want to work with?', {
      type: 'radio',
      choices: names
    });
    let answer = await enq.prompt('idlFile');
    return answer;
  }

  async _find(args) {
    const matches = this._findInterfaces(args[args.length - 1]);
    const answers = await this._select(matches);
    if (answers.idlFile[0] === CANCEL) { process.exit(); }
    let file = answers.idlFile[0].match(/\((\w+\.idl)\)/);
    for (let m of matches) {
      if (file[1] == m.name) {
        return m;
      }
    }
  }

  _show(file) {
    let idlFile = utils.getIDLFile(file.path());
    console.log(idlFile);
    console.log(`File located at ${file.path()}.`);
  }

  async findAndShow(args) {
    args = this._normalizeArguments(args, 'find');
    let file = await this._find(args);
    this._show(file);
  }

  async findAndBuild(args) {
    args = this._normalizeArguments(args, 'build');
    let file = await this._find(args);
    const id = new InterfaceData(file);
    if (id.type == 'dictionary') {
      console.log('mdn-helper does not yet process dictionaries.');
      console.log('Printing the interface instead.\n');
      this._show(file);
      return;
    }
    // const builder = new Builder(id, (args.includes('-j')));
    const options = { interfaceData: id, jsonOnly: args.includes('-j') };
    const builder = new IDLBuilder(options);
    builder.build();
  }

}

module.exports.Finder = _Finder;
