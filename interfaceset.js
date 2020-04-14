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

// global._bcd = new BCD();
// global.__Flags = require('./flags.js').FlagStatus('./idl/platform/runtime_enabled_features.json5');

const TYPES = ["interface", "interface mixin", "callback"];

class InterfaceSet {
  constructor() {
    this._interfaces = [];
  }

  [Symbol.iterator]() { return this._interfaces.values() }

  add(interfaceMetaObject) {
    this._interfaces.push(interfaceMetaObject);
  }

  findExact(searchValue, includeFlags=false, includeOriginTrials=false) {
    const matches = [];

    const isArray = Array.isArray(searchValue);
    for (let i of this._interfaces) {
      try {
        if ((includeFlags == false) && (i.flagged == true)) { continue; }
        if ((includeOriginTrials == false) && (i.originTrial == true)) { continue; }

        if (isArray) {
          if (searchValue.includes(i.name)) {
            matches.push(i);
          }
        } else {
          if (searchValue === "*") {
            matches.push(i);
          }
        }
      } catch (error) {
        switch (error.name) {
          case 'TypeError':
            const msg = `Problem processing ${i.sourcePath}\n${i.sourceContents}`;
            global.__logger.error(msg);
            break;
          default:
            throw error;
        }
      }
    }
    return matches;
  }

  findMatching(searchValue, includeFlags=false, includeOriginTrials=false) {
    const matches = [];
    const lcSearchName = searchValue.toLowerCase();

    for (let i of this._interfaces) {
      try {
        if ((includeFlags == false) && (i.flagged == true)) { continue; }
        if ((includeOriginTrials == false) && (i.originTrial == true)) { continue; }
        let lcKey = i.key.toLowerCase();
        if (searchValue == "*") {
          matches.push(i);
          continue;
        }
        if (!lcKey.includes(lcSearchName)) { continue; }
        matches.push(i);
      } catch (error) {
        switch (error.name) {
          case 'TypeError':
            const msg = `Problem processing ${i.sourcePath}\n${i.sourceContents}`;
            global.__logger.error(msg);
            break;
          default:
            throw error;
        }
      }
    }
    return matches;
  }

  getSubset(searchAray, includeFlags=false, includeOriginTrials=false) {
    
  }

  get count() {
    return this._interfaces.length;
  }

  get interfaces() {
    return this._interfaces;
  }
  
  // get keys() {
  //   const keys = [];
  //   for (let i of this._interfaces) {
  //     keys.push(i);
  //   }
  //   keys.sort();
  //   return keys;
  // }

  // writeKeys(toFile) {
  //   const keyList = this.keys.join('\n');
  //   fs.appendFileSync(tofile, keyList);
  // }
}

module.exports.InterfaceSet = InterfaceSet;