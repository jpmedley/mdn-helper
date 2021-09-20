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
const { DirectoryManager } = require('./directorymanager.js');
const utils = require('./utils.js');

class _BoilerplateBuilder {
  constructor() {
    const burnTypes = ["interface", "includes"];
    const dm = new DirectoryManager('idl/', { types: burnTypes });
    this._interfaceSet = dm.interfaceSet;
  }

  build() {
    const interfaces = this._interfaceSet.interfaces;
    let builderOptions;
    for (let i = 0; i < interfaces.length; i++) {
      builderOptions = {
        interfaceData: interfaces[i],
        outPath: utils.BOILERPLATES,
        verbose: false
      }
      const builder = new IDLBuilder(builderOptions);
      builder.build();
    }
  }
}

module.exports.BoilerplateBuilder = _BoilerplateBuilder;