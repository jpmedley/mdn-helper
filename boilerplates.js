// Copyright 2021 Google LLC
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

const { IDLBuilder } = require('./builder.js');
const { initiateLogger } = require('./log.js');
const { DirectoryManager } = require('./directorymanager.js');
const path = require('path');
const utils = require('./utils.js');
const config = require('config');

initiateLogger(global.__commandName);

class _BoilerplateBuilder {
  constructor(options = { mode: "Stable" }) {
    this.build = this._resolveBuildMode(options.mode);
    const burnTypes = ["interface", "includes"];
    const dm = new DirectoryManager('idl/', { types: burnTypes });
    this._interfaces = dm.interfaceSet.interfaces;
    const projectFiles = ['.git', 'LICENSE', 'README.md'];
    utils.deleteFolderContents(utils.getOutputDirectory(), projectFiles);
  }

  _resolveBuildMode(action) {
    switch (action.toLowerCase()) {
      case 'stable':
        return this._buildStable;
      case 'ot':
      case 'origintrials':
        return this._buildOriginTrials;
      default:
        const msg = `The action must be one of \'Stable\' or \'OriginTrials\'. The value ${action} was provided`;
        console.log(msg);
        process.exit();
    }
  }

  _buildOriginTrials() {
    let msg = `Now building interface boilerplates for all found Chrome origin trials.\n`;
    msg += `This may take a minute or two.`;
    let outPath = utils.resolveHome(config.get('Application.boilerplatesDirectory'));
    console.log(msg);
    let builderOptions = {
      interfaceOnly: true,
      mode: 'batch',
      withholdBCD: true,
      outPath: path.join(outPath, 'origin-trial'),
    }
    console.log(builderOptions.outPath);
    for (let i = 0; i < this._interfaces.length; i++) {
      if (!this._interfaces[i].originTrial) { continue; }
      builderOptions.interfaceData = this._interfaces[i];
      const builder = new IDLBuilder(builderOptions);
      builder.build('never');
    }
    msg = `\nBoilerplates written to ${builderOptions.outPath}.`
    console.log(msg);
  }

  _buildStable() {
    let msg = `\nNow building boilerplates for all outstanding Chrome platform APIs.\n`;
    msg += `This may take a minute or two.`;
    console.log(msg);
    let builderOptions = {
      mode: 'batch',
      outPath: path.join(config.get('Application.boilerplatesDirectory'), 'origin-trial'),
    }
    for (let i = 0; i < this._interfaces.length; i++) {
      if (this._interfaces[i].flagged) { continue; }
      if (this._interfaces[i].originTrial) { continue; }
      if (this._interfaces[i].mixin) { continue; }
      builderOptions.interfaceData = this._interfaces[i];
      const builder = new IDLBuilder(builderOptions);
      builder.build('never');
    }
    msg = `\nBoilerplates written to ${builderOptions.outPath}.`
    console.log(msg);
  }
}

module.exports.BoilerplateBuilder = _BoilerplateBuilder;