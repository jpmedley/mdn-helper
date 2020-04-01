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

const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');

const { BCD } = require('./bcd.js');
const { DirectoryManager } = require('./directorymanager.js');
const { FileProcessor } = require('./fileprocessor.js');
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
    const matches = this._interfaces.findMatching(
      interfacesNamed,
      this._includeFlags,
      this._includeOriginTrials
    );
    if (matches.length == 0) {
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
    });
    if (args[1].includes('app_Builder.js')) {
      this._landingPageOnly = args.some(arg => {
        return (arg.includes('-l') || (arg.includes('--landing-page')));
      });
    };
    if (args[1].includes('app_Finder.js')) {
      this._ping = args.some(arg => {
        return (arg.includes('-p') || (arg.includes('--ping')));
      });
    };
  }

  async _select(matches) {
    let names = [];
    for (let m of matches) {
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
    return answer;
  }

  async _find() {
    const matches = this._findInterfaces(this._searchString);
    const answers = await this._select(matches);
    if (answers.idlFile[0] === CANCEL) { process.exit(); }
    let key = answers.idlFile[0].match(/(\w+)\s/);
    let match;
    for (let m of matches) {
      if (m.key === key[1]) {
        match = m;
        break;
      }
    }
    return match;
  }

  _show(file) {
    let idlFile = utils.getIDLFile(file.path);
    console.log(idlFile);
    console.log(`File located at ${file.path}.`);
  }

  async findAndShow() {
    let metaFile = await this._find();
    if (this._ping) {
      let id;
      const fp = new FileProcessor(metaFile.path);
      fp.process((result) => {
        id = new result.type(result.tree, result.path)
      }, true);
      console.log('Checking for existing MDN pages. This may take a few minutes.\n');
      const pingRecords = await id.ping(false);
      console.log('Exists?   Interface');
      console.log('-'.repeat(51));
      pingRecords.forEach(r => {
        let exists = r.mdn_exists.toString().padEnd(10);
        console.log(`${exists}${r.key}`);
      })
      console.log();
      await utils.pause();
    }

    this._show(metaFile);
  }

  async findAndBuild() {
    let metaFile = await this._find();
    let id;
    const fp = new FileProcessor(metaFile.path);
    fp.process((result) => {
      id = new result.type(result.tree, result.path);
    }, true)
    const options = {
      interactive: this._interactive,
      interfaceData: id,
      jsonOnly: this._jsonOnly,
      landingPageOnly: this._landingPageOnly
    }; 
    const builder = new IDLBuilder(options);
    builder.build();
  }

}

module.exports.Finder = _Finder;
