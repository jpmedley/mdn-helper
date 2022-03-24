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

// const { Select } = require('enquirer');

const { ChromeIDLSource } = require('./sourceprocessor.js');
const { FlagStatus } = require('./flags.js');
const { IDLBuilder } = require('./builder.js');
const { InterfaceSearchSet } = require('./interfaceset.js');
const utils = require('./utils.js');

const fs = require('fs');
const { util } = require('config');

global.__Flags = FlagStatus();

function _finderFactory(args) {
  //First few args are no longer needed.
  args.shift();
  const matches = args[0].match(/app_([^\.]+)\.js/);
  const revisedArgs = [];
  revisedArgs.push(matches[1]);
  args.shift();
  const searchDomain = args[0].toLowerCase();
  if (!args[0]) {
    searchDomain = 'idl';
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
  constructor(args, options) {
    utils.sendUserOutput("CSSFinder is not yet available.\n");
    process.exit();
  }
}

class IDLFinder {
  constructor(args, options = { iDLDirectory: `${utils.APP_ROOT}/idl/` }) {
    this._processArguments(args)
    let cis = new ChromeIDLSource(options.iDLDirectory);
    this._sources = cis.getFeatureSources();
  }

  // async _selectMixinsToPing(interfaces) {
  //   if (interfaces[0].mixin) {
  //     let promptMsg = `\nThe ${interfaces[0].name} interface is a mixin and will not appear with that\n`;
  //         promptMsg += `name on MDN. Its members will appear as part of the interfaces below. Which\n`;
  //         promptMsg += `interfaces would yo like to ping?\n`;
  //     let names = []
  //     for (let i of interfaces) {
  //       if (i.type === 'includes') {
  //         names.push(i.name);
  //       }
  //     }
  //     names = names.sort();
  //     names.push(CANCEL);
  //     const prompt = new Select({
  //       name: 'interface',
  //       message: promptMsg,
  //       choices: names
  //     });
  //     let answer = await prompt.run();
  //     if (answer === CANCEL) { return; }
  //     return interfaces.find(i => {
  //       return i.name === answer;
  //     });
  //   } else {
  //     return interfaces[0];
  //   }
  // }

  // _findInterfaces(interfacesNamed) {
  //   const matches = this._interfaces.findMatching(
  //     interfacesNamed,
  //     this._includeFlags,
  //     this._includeOriginTrials
  //   );
  //   return matches;
  // }

  _processArguments(args) {
    this._searchString = args[1].toLowerCase();
    this._interactive = args.some(arg => {
      return (arg.includes('-i') || (arg.includes('--interactive')));
    });
    this._includeFlags = args.some(arg => {
      return (arg.includes('-f') || (arg.includes('--flags')));
    });
    this._includeOriginTrials = args.some(arg => {
      return (arg.includes('-o') || (arg.includes('--origin-trials')));
    });
    this.__bcdOnly = args.some(arg => {
      return (arg.includes('-b') || (arg.includes('--bcdOnly')));
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
      this._dump = args.some(arg => {
        return (arg.includes('-d') || (arg.includes('--dump-names')));
      });
    }
  }

  get includeFlags() {
    return this._includeFlags;
  }

  get includeOriginTrials() {
    return this._includeOriginTrials;
  }

  // async _findForListing() {
  //   const matches = this._findInterfaces(this._searchString);
  //   if (matches.length == 0) {
  //     utils.sendUserOutput(NOTHING_FOUND);
  //     if (!this._includeFlags && !this._includeOriginTrials) {
  //       utils.sendUserOutput(TRY_RUNNING);
  //     }
  //     process.exit();
  //   }
  //   let names = [];
  //   for (let m of matches) {
  //     let steps = m.path.split('/');
  //     const type = ((m) => {
  //       if (m.type === 'includes') { return 'mixin'; }
  //       return m.type;
  //     })(m);
  //     names.push(`"${m.keys[0]}",`);
  //   }
  //   names = names.sort();
  //   let nameList = names.join('\n');
  //   utils.sendUserOutput(nameList);
  // }

  // async _findForUI() {
  //   const matches = this._findInterfaces(this._searchString);
  //   if (matches.length == 0) {
  //     utils.sendUserOutput(NOTHING_FOUND);
  //     if (!this._includeFlags && !this._includeOriginTrials) {
  //       utils.sendUserOutput(TRY_RUNNING);
  //     }
  //     process.exit();
  //   }
  //   let names = [];
  //   for (let m of matches) {
  //     let steps = m.path.split('/');
  //     const type = ((m) => {
  //       if (m.type === 'includes') { return 'mixin'; }
  //       return m.type;
  //     })(m);
  //     names.push(`${m.keys[0]} (${type} from ${steps[steps.length-1]})`);
  //   }
  //   names = names.sort();
  //   names.push(CANCEL);
  //   const prompt = new Select({
  //     name: 'idlFile',
  //     message: 'Which interface do you want to work with?',
  //     choices: names
  //   });
  //   let answer = await prompt.run();
  //   if (answer === CANCEL) { process.exit(); }
  //   const pieces = answer.split(' ');
  //   const key = pieces[3].slice(0, -1).trim();
  //   const answerData = matches.find(elem => {
  //     return elem._sourcePath.includes(`/${key}`);
  //   });
  //   return answerData;
  // }

  // _show(file) {
  //   let idlFile = utils.getIDLFile(file.path);
  //   utils.sendUserOutput(idlFile);
  //   utils.sendUserOutput(`File located at ${file.path}.`);
  // }


  // async findAndShow() {
  //   if (this._dump) {
  //     this._findForListing();
  //   } else {
  //     await this._select();
  //   }
  // }

  // async _select() {
  //   this._printInstructions();
  //   let metaFile = await this._findForUI();
  //   let show = true;
  //   if (this._ping) {
  //     let ids = [];
  //     const fp = new FileProcessor(metaFile.path);
  //     fp.process((result) => {
  //       ids.push(result);
  //     });
  //     let id = await this._selectMixinsToPing(ids);
  //     if (id) {
  //       utils.sendUserOutput('Checking for existing MDN pages. This may take a few minutes.\n');
  //       const pingRecords = await id.ping(false);
  //       this._showPingResults(pingRecords);
  //       const msg = 'Display IDL file?';
  //       show = await utils.confirm(msg);
  //     }
  //   }
  //   if (show) {
  //     utils.sendUserOutput();
  //     this._show(metaFile);
  //   }
  // }

  // _showPingResults(pingRecords) {
  //   let lines = [];
  //   let longest = 0;
  //   pingRecords.forEach(r => {
  //     if (r.key.length > longest) { longest = r.key.length; }
  //   });
  //   pingRecords.forEach(r => {
  //     let exists = r.mdn_exists.toString().padEnd(8);
  //     let key = r.key.toString().padEnd(longest + 1);
  //     let url = r.mdn_url.toString();
  //     lines.push(`${exists}${key}${url}`);
  //   });
  //   let ifaceHeader = "Interface".padEnd(longest + 1);
  //   let header = `Exists? ${ifaceHeader}URL`;
  //   utils.sendUserOutput(header);
  //   utils.sendUserOutput('-'.repeat(header.length * 2));
  //   lines.forEach(l => {
  //     utils.sendUserOutput(l);
  //   })
  //   utils.sendUserOutput();
  // }

  async find(types = ['interface']) {
    let matches = new Array();
    this._sources.forEach((s) => {
      if (s.name.toLowerCase().includes(this._searchString) && types.includes(s.type)) {
        const flagStatus = global.__Flags.getHighestResolvedStatus(s.flag);
        switch (flagStatus) {
          // Could cover status 'test' which is earlier than DevTrial,
          //  but 'test' items should never be documented.
          case 'devtrial':
            if (this._includeFlags) { matches.push(s); }
            break;
          case 'origintrial':
            if (this._includeOriginTrials) { matches.push(s); }
            break;
          case 'stable':
            matches.push(s);
            break;
        }
      }
    });
    matches.sort((a, b) => {
      if (a.name > b.name) { return 1; }
      if (a.name < b.name) { return -1; }
      return 0
    });
    return matches;
  }

  async findAndReturn() {
    return undefined;
  }

  // async findAndBuild() {
  //   this._printInstructions()
  //   let metaFile = await this._findForUI();
  //   let ids = [];
  //   const fp = new FileProcessor(metaFile.path);
  //   fp.process((result) => {
  //     ids.push(result);
  //   }, true);
  //   let id = ids.find((id) => {
  //     return id.name === metaFile.name;
  //   })
  //   const options = {
  //     interactive: this._interactive,
  //     interfaceData: id,
  //     bcdOnly: this.__bcdOnly,
  //     landingPageOnly: this._landingPageOnly
  //   }; 
  //   const builder = new IDLBuilder(options);
  //   builder.build();
  // }

}

module.exports.FinderFactory = _finderFactory;
module.exports.CSSFinder = CSSFinder;
module.exports.Finder = IDLFinder; // Deprecated
module.exports.IDLFinder = IDLFinder;
