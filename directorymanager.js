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

const { FileProcessor } = require('./fileprocessor.js')
const fs = require('fs');
const { InterfaceSet } = require('./interfaceset.js');

const EXCLUSIONS = ['inspector','testing','typed_arrays'];

class DirectoryManager {
  constructor(rootDirectory = 'idl/', options) {
    // options._includeExperimental = (options.experimental? options.experimental: false);
    // options._includeOriginTrial = (options.originTrial? options.originTrial: false);
    // this._options = options;
    this._root = rootDirectory;
  }

  _processDirectory(root) {
    const contents = fs.readdirSync(root, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (EXCLUSIONS.includes(contents[c].name)) { continue; }
        this._processDirectory(`${root}${contents[c].name}/`);
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        try {
          let fp = new FileProcessor(`${root}${contents[c].name}`);
          // fp.process(this._options);
          fp.process((result) => {
            this._interfaceSet.add(result);
          });
        } catch (error) {      
          // console.log(`A webidl2 bug currently prevents processing of ${root}${contents[c].name}.`)
        }
      }
    }
  }

  get interfaceSet() {
    if (this._interfaceSet) { return this._interfaceSet; }
    this._interfaceSet = new InterfaceSet();
    this._processDirectory(this._root);
    return this._interfaceSet;
  }
}

module.exports.DirectoryManager = DirectoryManager;