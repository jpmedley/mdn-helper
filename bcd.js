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

const bcd = require('mdn-browser-compat-data');

const SKIPABLE = ['__compat','__name','__parent','browsers','description','mathml','mdn_url','getPossibleKeys','webdriver','webextensions','xpath','xslt'];

function generateFullKey(currentKey) {
  if (!currentKey.__parent) { return currentKey.__name; }
  let resultArray = new Array();
  do {
    resultArray.push(currentKey.__name);
    currentKey = currentKey.__parent;
  } while (currentKey.__parent);
  resultArray = resultArray.reverse();
  const result = resultArray.join('.');
  return result;
}

class BCD {
  constructor() {
    this._decorate(bcd);
    bcd.getPossibleKeys = this.getPossibleKeys;
    this.getPossibleKeys.bind(bcd);
    bcd.getByKey = this.getByKey;
    this.getByKey.bind(bcd);
    return bcd;
  }

  _decorate(data) {
    let keys = Object.keys(data);
    if (keys.length) {
      for (let k of keys) {
        if (!data[k]) { continue; }
        if (k == '__parent') { continue; }
        if (typeof data[k] != 'object') { continue; }
        data[k].__parent = data;
        data[k].__name = k;
        this._decorate(data[k]);
      }
    }
  }

  getByKey(key) {
    if (key.startsWith('on')) {
      key = key.replace('on', '');
      key += '_event';
    }
    const keys = key.split('.');
    let branch = this;
    for (let k of keys) {
      if (!branch[k]) { return null; }
      branch = branch[k];
    }
    return branch;
  }

  getPossibleKeys(withString) {
    let results = new Array();
    (function getKeys(tree, results) {
      let keys = Object.keys(tree);
      if (!keys.length) { throw new Error(); }
      for (let k in tree) {
        if (SKIPABLE.includes(k)) { continue; }
        let fullKey = generateFullKey(tree[k]);
        if (fullKey.includes(withString)) {
          results.push(fullKey);
        }
        getKeys(tree[k], results);
      }
    })(this, results);
    return results;
  }

}

module.exports.BCD = BCD;
