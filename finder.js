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

const { Select } = require('enquirer');

const { DirectoryManager } = require('./directorymanager.js');
const { FileProcessor } = require('./fileprocessor.js');
const { IDLBuilder } = require('./builder.js');
const utils = require('./utils.js');

const NOTHING_FOUND = "Could not find matching IDL files.\n\nTry running this command with the -f or -o flags to search for items behind\nflags or in origin trials.\n"
const CANCEL = '(none)';

function _finderFactory(args) {
  //First few args are no longer needed.
  args.shift();
  const matches = args[0].match(/app_([^\.]+)\.js/);
  const revisedArgs = [];
  revisedArgs.push(matches[1]);
  args.shift();
  const searchDomain = args[0].toLowerCase();
  let msg = `The action must be one of \'css\' or \'idl\'. The value ${searchDomain} was provided`;
  if (!args[0]) {
    msg = `You must provide an action type. ${msg}`;
  }
  args.shift();
  revisedArgs.push(...args);
  switch (searchDomain) {
    case 'css':
      return new CSSFinder(revisedArgs);
    case 'idl':
      return new IDLFinder(revisedArgs);
    default:
      throw new Error(msg);
  }
}

class CSSFinder {
  constructor(args) {
    console.log("CSSFinder is not yet available.\n");
    process.exit();
  }
}

class IDLFinder {
  constructor(args) {
    this._processArguments(args)
    let dm = new DirectoryManager(`${utils.APP_ROOT}/idl/`)
    this._interfaces = dm.interfaceSet;
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
    this._searchString = args[1];
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
    if (args[0] === 'Builder') {
      this._landingPageOnly = args.some(arg => {
        return (arg.includes('-l') || (arg.includes('--landing-page')));
      });
    }
    if (args[0] === 'Finder') {
      this._ping = args.some(arg => {
        return (arg.includes('-p') || (arg.includes('--ping')));
      });
    }
  }

  async _select(matches) {
    let names = [];
    for (let m of matches) {
      let steps = m.path.split('/');
      names.push(`${m.keys[0]} (${steps[steps.length-1]})`);
    }
    names = names.sort();
    names.push(CANCEL);
    const prompt = new Select({
      name: 'idlFile',
      message: 'Which interface do you want to work with?',
      choices: names
    });
    let answer = await prompt.run();
    if (answer === CANCEL) { process.exit(); }
    const pieces = answer.split('(');
    const key = pieces[1].slice(0, -1).trim();
    const answerData = matches.find(elem => {
      return elem.path.includes(key);
    });
    return answerData;
  }

  async _find() {
    const matches = this._findInterfaces(this._searchString);
    const answer = await this._select(matches);
    return answer;
  }

  _show(file) {
    let idlFile = utils.getIDLFile(file.path);
    console.log(idlFile);
    console.log(`File located at ${file.path}.`);
  }

  _printInstructions() {
    const msg = `Use the up and down arrow to find the interface you want. Then press return.\n`
    console.log(msg);
  }

  async findAndShow() {
    this._printInstructions();
    let metaFile = await this._find();
    if (this._ping) {
      let id;
      const fp = new FileProcessor(metaFile.path);
      fp.process((result) => {
        id = result;
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
    this._printInstructions()
    let metaFile = await this._find();
    let id;
    const fp = new FileProcessor(metaFile.path);
    fp.process((result) => {
      id = result;
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

module.exports.FinderFactory = _finderFactory;
module.exports.CSSFinder = CSSFinder;
module.exports.Finder = IDLFinder;
