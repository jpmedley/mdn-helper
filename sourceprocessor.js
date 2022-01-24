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

const fs = require('fs');
const path = require('path');

const utils = require('./utils.js');

const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

class _SourceProcessor_Base {
  #EXCLUSIONS = [];
  constructor(sourceLocation, options) {
    this._name;
    this._rawData;
  }

  #processDirectory(root) {
    const contents = fs.readdirSync(root, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (this.#EXCLUSIONS.includes(contents[c].name)) { continue; }
        this.#processDirectory(`${root}${contents[c].name}/`);
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        try {
          // let fp = new FileProcessor(`${root}${contents[c].name}`);
          // fp.process((result) => {
          //   if (this._types.includes(result.type)) {
          //     if (!result.inTest) {
          //       this._interfaceSet.add(result);
          //     }
          //   }
          // });
        } catch (error) {
          global.__logger.info(`Cannot process ${root}${contents[c].name}.`);
        }
      }
    }
  }

  get name() {
    return this._name;
  }

  get rawData() {
    return this._rawData;
  }

  featureSources() {
    
  }
}

class IDLSource extends _SourceProcessor_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }
}

class ChromeIDLSource extends IDLSource {
  #EXCLUSIONS = ['inspector','testing','typed_arrays'];
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
    // Excluded directories: 

  }
}

class CSSSource extends _IDLSource_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }
}

export const {
  ChromeIDLSource,
  CSSSource,
  IDLSource
}