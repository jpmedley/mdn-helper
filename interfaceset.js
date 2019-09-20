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

  findMatching(name, includeFlags=false, includeOriginTrials=false) {
    const matches = [];
    const lcName = name.toLowerCase();
    if (includeFlags) {
      matches.push(...this._findSubset(lcName, 'flag'));
    }
    if (includeOriginTrials) {
      matches.push(...this._findSubset(lcName, 'originTrial'));
    }
    for (let i of this._interfaces) {
      if (i.flag || i.originTrial) { continue; }
      let lcKey = i.keys[0].toLowerCase();
      if (lcKey.includes(lcName)) {
        matches.push(i);
      }
    }
    return matches;
  }

  _findSubset(name, flag) {
    let matches = [];
    for (let i of this._interfaces) {
      if (i[flag] == false) { continue; }
      let lcKey = i.keys[0].toLowerCase();
      if (lcKey.includes(name)) {
        matches.push(i);
      }
    }
    return matches;
  }

  get count() {
    return this._interfaces.length;
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