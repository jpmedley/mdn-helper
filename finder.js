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

const { BCD } = require('./bcd.js');
const cb = require('prompt-checkbox');
const { DirectoryManager } = require('./directorymanager.js');
const Enquirer = require('enquirer');
// const { IDLFileSet } = require('./idlfileset.js');
const { InterfaceData } = require('./interfacedata.js');
const { IDLBuilder } = require('./builder.js');
const utils = require('./utils.js');

const NOTHING_FOUND = "Could not find matching IDL files."
const CANCEL = '(none)';

global._bcd = new BCD();
global.__Flags = require('./flags.js').FlagStatus('./idl/platform/runtime_enabled_features.json5');

class _Finder {
  constructor(args) {
    this._processArguments(args)
    let dm = new DirectoryManager('idl/');
    this._interfaces = dm.interfaceSet;
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
    // const matches = this.idlSet.findMatching(interfacesNamed);
    const matches = this._interfaces.findMatching(
      interfacesNamed,
      this._includeFlags,
      this._includeOriginTrials
    );
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

  _processArguments(args) {
    this._searchString = args[2];
    this._interactive = args.some(arg => {
      return (arg.includes('-i') || (arg.includes('--interactive')));
    });
    this._includeFlags = args.some(arg => {
      return (arg.includes('-f') || (arg.includes('--flags')));
    });
    this._includeOriginTrials = args.some(arg => {
      return (arg.includes('-o') || (arg.includes('--origin-trials')));
    });
    this._jsonOnly = args.some(arg => {
      return (arg.includes('-j') || (arg.includes('--jsonOnly')));
    })
    if (args[1].includes('app_Finder.js')) {
      this._ping = args.some(arg => {
        return (arg.includes('-p') || (arg.includes('--ping')));
      });
    };
  }

  async _select(matches) {
    let names = [];
    for (let m of matches) {
      // names.push(m.key + ` (${m.name})`);
      let steps = m.path.split('/');
      names.push(`${m.keys[0]} (${steps[steps.length-1]})`);
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
    // answer = answer.idlFile[0].split(' ')[0];
    return answer;
  }

  async _find() {
    const matches = this._findInterfaces(this._searchString);
    const answers = await this._select(matches);
    if (answers.idlFile[0] === CANCEL) { process.exit(); }
    let file = answers.idlFile[0].match(/\((\w+\.idl)\)/);
    let match;
    for (let m of matches) {
      if (m.path.includes(file[1])) {
        match = m;
        break;
      }
    }

    // let match = matches.find((match, index, matches) => {
    //   match.path.includes(this[0]);
    // }, file);
    return match;
  }

  _show(file) {
    let idlFile = utils.getIDLFile(file.path);
    console.log(idlFile);
    console.log(`File located at ${file.path}.`);
  }

  async findAndShow() {
    let file = await this._find();
    // if (this._ping) {
    //   const id = new InterfaceData(file, {
    //     experimental: false,
    //     originTrial: false
    //   });
    //   if (id.type == 'dictionary') {
    //     console.log('mdn-helper does not yet ping dictionaries.');
    //   } else {
    //     const pingRecords = await id.ping();
    //     console.log('Exists?   Interface');
    //     console.log('-'.repeat(51));
    //     pingRecords.forEach(r => {
    //       // console.log(r);
    //       let exists = r.mdn_exists.toString().padEnd(10);
    //       console.log(exists + r.key);
    //     });
    //     await utils.pause();
    //   }
    // }

    this._show(file);
  }

  async findAndBuild() {
    let file = await this._find();
    const id = new InterfaceData(file, {
      experimental: this._includeFlags,
      originTrial: this._includeOriginTrials
    });
    if (id.type == 'dictionary') {
      console.log('mdn-helper does not yet process dictionaries.');
      console.log('Printing the interface instead.\n');
      this._show(file);
      return;
    }
    const options = {
      interfaceData: id,
      jsonOnly: this._jsonOnly,
      interactive: this._interactive
    };
    const builder = new IDLBuilder(options);
    builder.build();
  }

}

module.exports.Finder = _Finder;
