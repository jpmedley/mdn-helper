// Copyright 2022 Google LLC
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

const { FinderFactory, IDLFinder } = require('./finder.js');
const { BuilderFactory, IDLBuilder } = require('./builder.js');
const { SourceRecord } = require('./rawsources.js');
const utils = require('./utils.js');

const { Select } = require('enquirer');
const { Pinger } = require('./pinger.js');
const { pageFactory } = require('./page.js');

const NOTHING_FOUND = "Could not find matching IDL files.\n"
const TRY_RUNNING = "\nTry running this command with the -f or -o flags to search for items behind\nflags or in origin trials.\n";
const CANCEL = '(none)';



function printInstructions() {
  const msg = `Use the up and down arrow to find the interface you want. Then press return.\n`
  utils.sendUserOutput(msg);
}

class _InterfaceBase {
  constructor(args) {
    this._includeFlags;
    this._includeOriginTrials;
    this._ping;
    this._searchDomain;
    this._searchString;
    this._bcdOnly;
    this._dump;
    this._landingPageOnly;
  }

  async _pingInterfaces(sourceRecord, verboseOutput = true) {
    const pingRecords = sourceRecord.getBurnRecords();
    const pinger = new Pinger(pingRecords);
    if (verboseOutput) {
      utils.sendUserOutput('\nChecking for existing MDN pages. This may take a few minutes.\n');
    }
    const pingResults = await pinger.pingRecords()
    .catch((e) => {
      throw e;
    });
    return pingResults;
  }

  _processArguments(args) {
    this._searchDomain = args[2].toLowerCase()
    this._searchString = args[3].toLowerCase();
    this._includeFlags = args.some(arg => {
      return (arg.includes('-f') || (arg.includes('--flags')));
    });
    this._includeOriginTrials = args.some(arg => {
      return (arg.includes('-o') || (arg.includes('--origin-trials')));
    });
    this._bcdOnly = args.some(arg => {
      return (arg.includes('-b') || (arg.includes('--bcdOnly')));
    });
    if (global.__commandName === 'Builder') {
      this._landingPageOnly = args.some(arg => {
        return (arg.includes('-l') || (arg.includes('--landing-page')));
      });
    }
    if (global.__commandName === 'Finder') {
      this._ping = args.some(arg => {
        return (arg.includes('-p') || (arg.includes('--ping')));
      });
      this._dump = args.some(arg => {
        return (arg.includes('-d') || (arg.includes('--dump-names')));
      });
    }
  }

  async _select() {
    const types = ['interface', 'mixin', 'partial'];
    const options = {
      includeFlags: this._includeFlags,
      includeOriginTrials: this._includeOriginTrials
    }
    const possibleMatches = await this._finder.find(this._searchString, types, options);
    if (possibleMatches.length === 0) {
      utils.sendUserOutput(NOTHING_FOUND);
      if (!this._finder.includeFlags && !this._finder.includeOriginTrials) {
        utils.sendUserOutput(TRY_RUNNING);
      }
      process.exit();
    }
    printInstructions();
    let choices = new Array();
    possibleMatches.forEach((p) => {
      for (let s of p.sources) {
        let shortPath = s.path.split(utils.APP_ROOT);
        choices.push(`${p.name} (${p.type} from ${shortPath[1]})`);
      }
    });
    choices.push(CANCEL);
    const prompt = new Select({
      name: 'idlFile',
      message: 'Which interface do you want to work with?',
      choices: choices
    });
    let answer = await prompt.run();
    if (answer === CANCEL) { process.exit(); }
    const pieces = answer.split(' ');
    const key = pieces[3].slice(0, -1).trim();

    
    const match = possibleMatches.find((p) => {
      return p.sources.some((s) => {
        return s.path.includes(key);
      });
    });
    const source = match.sources.find((s) => {
      return s.path.includes(key);
    })
    const answerData = new SourceRecord(match.name, match.type, source);
    return answerData;
  }
}

class BuilderInterface extends _InterfaceBase {
  constructor(args) {
    super(args);
    this._interactive;
    this._processArguments(args);
    let Finder = FinderFactory(this._searchDomain);
    const idlDirectory = utils.getConfig('idlDirectory')
    this._finder = new Finder(`${utils.APP_ROOT}${idlDirectory}/`)
  }

  async build() {
    const sourceRecord = await this._select();
    let Builder = BuilderFactory(this._searchDomain);
    const idlDirectory = utils.getConfig('idlDirectory');
    const options = {
      interactive: this._interactive,
      interfaceData: sourceRecord,
      bcdOnly: this._bcdOnly,
      landingPageOnly: this._landingPageOnly
    }
    const builder = new Builder(options);
    builder.build();
  }
  
  _processArguments(args) {
    super._processArguments(args);
    this._interactive = args.some(arg => {
      return (arg.includes('-i') || (arg.includes('--interactive')));
    });
  }
}

class FinderInterface extends _InterfaceBase {
  constructor(args) {
    super(args);
    this._processArguments(args);
    let Finder = FinderFactory(this._searchDomain);
    const idlDirectory = utils.getConfig('idlDirectory')
    this._finder = new Finder(`${utils.APP_ROOT}${idlDirectory}/`)
  }

  async find() {
    let show = true;
    const sourceRecord = await this._select();
    if (this._ping) {
      const pingResults = await this._pingInterfaces(sourceRecord);
      this._showPingResults(pingResults);
      const msg = 'Display IDL file?';
      show = await utils.confirm(msg);
    }
    if (show) {
      this._show(sourceRecord);
    }
  }

  _showPingResults(pingResults) {
    let lines = [];
    let longest = 0;
    pingResults.forEach((r) => {
      if (r.key.length > longest) { longest = r.key.length; }
    });
    pingResults.forEach((r) => {
      let exists = r.mdn_exists.toString().padEnd(8);
      let name = r.name.toString().padEnd(longest + 1);
      let url = r.mdn_url.toString();
      lines.push(`${exists}${name}${url}`);
    });
    let ifaceHeader = "Interface".padEnd(longest + 1);
    let header = `Exists? ${ifaceHeader}URL`;
    utils.sendUserOutput(header);
      utils.sendUserOutput('-'.repeat(header.length * 2));
      lines.forEach(l => {
        utils.sendUserOutput(l);
      })
      utils.sendUserOutput();
  }

  _show(answer) {
    let idlFile = utils.getIDLFile(answer.sources[0].path);
    utils.sendUserOutput();
    utils.sendUserOutput(idlFile);
    let shortPath = answer.sources[0].path.split(utils.APP_ROOT);
    utils.sendUserOutput(`File located at ${shortPath[1]}`);
  }

}

module.exports.BuilderInterface = BuilderInterface;
module.exports.FinderInterface = FinderInterface;