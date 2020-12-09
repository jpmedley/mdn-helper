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

const bcd = require('@mdn/browser-compat-data');

const SKIPABLE = ['__compat','__name','__parent','browsers','description','mathml','mdn_url','getPossibleKeys','webdriver','webextensions','xpath','xslt'];
const URL_ROOT = 'https://developer.mozilla.org/docs/Web/';

const EMPTY_BURN_RECORD = Object.freeze({
  key: null,
  bcd: null,
  flag: null,
  mdn_exists: null,
  mdn_url: '',
  name: '',
  origin_trial: null,
  redirect: null,
  type: ''
});

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
    this._bindNewMembers(bcd);
    return bcd;
  }

  _bindNewMembers(bcd) {
    bcd.getPossibleKeys = this.getPossibleKeys;
    this.getPossibleKeys.bind(bcd);
    bcd.getByKey = this.getByKey;
    this.getByKey.bind(bcd);
    bcd.getRecordByKey = this.getRecordByKey;
    this.getRecordByKey.bind(bcd);
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

  getByKey(key, trunk = "api") {
    let branch = this[trunk];
    if (key === trunk) { return branch; }
    let chain = key.split(".").reverse();
    while (chain.length) {
      let link = chain[chain.length - 1];
      if (link.startsWith('on')) {
        link = link.replace('on', '');
        link += '_event';
      }
      if (!branch[link]) { return null; }
      branch = branch[link];
      chain.pop();
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

  getRecordByKey(key, trunk = 'api') {
    // Assumes trunk in BCD and root in URL are congruent.
    // May not always be true.
    let burnRecord = Object.assign({}, EMPTY_BURN_RECORD);
    burnRecord.key = key;
    const bcdData = this.getByKey(key, trunk);
    if (bcdData) {
      burnRecord.bcd = true;
      if (bcdData.__compat) {
        burnRecord.mdn_url = bcdData.__compat.mdn_url;
        if (!burnRecord.mdn_url) {
          let path = key.replace(".", "/");
          burnRecord.mdn_url = `${URL_ROOT}${trunk.toUpperCase()}/${path}`;
        }
      }
    } else {
      burnRecord.bcd = false;
      burnRecord.mdn_exists = false;
    }
    return burnRecord;
  }

}

// module.exports.BCD = BCD;
if (!global.__bcd) { 
  global.__bcd = new BCD();
}
module.exports.bcd = global.__bcd;
module.exports.EMPTY_BURN_RECORD = EMPTY_BURN_RECORD;
