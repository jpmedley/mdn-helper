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

class InterfaceSet {
  constructor() {
    this._interfaces = [];
  }

  [Symbol.iterator]() { return this._interfaces.values() }

  add(interfaceMetaObject) {
    this._interfaces.push(interfaceMetaObject);
  }

  findExact(searchValOrArray, includeFlags=false, includeOriginTrials=false) {
    const matches = new Map();

    const isArray = Array.isArray(searchValOrArray);
    for (let i of this._interfaces) {
      try {
        if ((includeFlags == false) && (i.flagged == true)) { continue; }
        if ((includeOriginTrials == false) && (i.originTrial == true)) { continue; }

        if (isArray) {
          let found = searchValOrArray.some(elem => {
            let key = elem.split(".")[0];
            return (key === i.name)
          });
          if (found) {
            matches.set(i.name, i);
          }
        } else {
          if (searchValOrArray === "*") {
            // matches.push(i);
            matches.set(i.name, i);
          }
        }
      } catch (error) {
        switch (error.name) {
          case 'TypeError':
            const msg = `Problem processing ${i.sourcePath}\n${i.sourceContents}`;
            global.__logger.info(msg);
            break;
          default:
            global.__logger.error(error);
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
            global.__logger.info(msg);
            break;
          default:
            global.__logger.error(msg);
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

  get interfaceNames() {
    const names = [];
    const ifs = this.interfaces;
    for (let i of ifs) {
      names.push(i.name);
    }
    return names;
  }
}

class InterfaceSearchSet extends InterfaceSet {
  constructor() {
    super();
  }
}

module.exports.InterfaceSearchSet = InterfaceSearchSet;
module.exports.InterfaceSet = InterfaceSet;