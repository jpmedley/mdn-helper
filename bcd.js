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
const URL_ROOT = 'https://developer.mozilla.org/en-US/docs/Web/';

const ENGINES = [
  {
    "name": "chrome",
    "engine": "Chromium"
  },
  {
    "name": "chrome_android",
    "engine": "Chromium"
  },
  {
    "name": "deno",
    "engine": "IGNORE"
  },
  {
    "name": "edge",
    "engine": "Chromium"
  },
  {
    "name": "ie",
    "engine": "IGNORE"
  },
  {
    "name": "firefox",
    "engine": "Gecko"
  },
  {
    "name": "firefox_android",
    "engine": "Gecko"
  },
  {
    "name": "nodejs",
    "engine": "Chromium"
  },
  {
    "name": "opera",
    "engine": "Chromium"
  },
  {
    "name": "opera_android",
    "engine": "Chromium"
  },
  {
    "name": "safari",
    "engine": "WebKit"
  },
  {
    "name": "safari_ios",
    "engine": "WebKit"
  },
  {
    "name": "samsunginternet_android",
    "engine": "Chromium"
  },
  {
    "name": "webview_android",
    "engine": "Chromium"
  },
]

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
    bcd.getEngines = this.getEngines;
    this.getEngines.bind(bcd);
    bcd.getBrowsers = this.getBrowsers;
    this.getBrowsers.bind(bcd);
    bcd.getVersions = this.getVersions;
    this.getVersions.bind(bcd);
    bcd.getURLByKey = this.getURLByKey;
    this.getURLByKey.bind(bcd);
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

  getVersions(key, browsers =  ['chrome'], trunk = 'api') {
    const branch = this.getByKey(key, trunk);
    if (!branch) { return null; }
    const support = branch?.__compat?.support;
    if (!support) { return ''; }
    let versions = [];
    let temp;
    for (let b of browsers) {
      if (!support[b]) { continue; }
      temp = support[b]
      if (temp.version_added) {
        versions.push(temp.version_added);
      } else {
        versions.push('Not supported');
      }
    }
    return versions.join(', ');
  }

  getBrowsers(key, trunk = 'api') {
    const branch = this.getByKey(key, trunk);
    if (!branch) { return null; }
    const support = branch?.__compat?.support;
    let browsers = [];
    for (const s in support) {
      if (s === '__parent') { continue; }
      if (s === '__name') { continue; }
      browsers.push(s);
    }
    return browsers;
  }

  getByKey(key, trunk = "api") {
    let branch = this[trunk];
    if (key === trunk) { return branch; }
    let chain = key.split(".").reverse();
    while (chain.length) {
      let link = chain[chain.length - 1];
      if (!branch[link]) { return null; }
      branch = branch[link];
      chain.pop();
    }
    return branch;
  }

  getEngines(key, trunk = 'api') {
    const branch = this.getByKey(key, trunk);
    if (!branch) { return null; }
    const support = branch?.__compat?.support;
    if (!support) { return null; }
    let engines = [];
    ENGINES.forEach(e => {
      if (e.engine === 'IGNORE') { return; }
      const browser = support[e.name];
      if (!browser) { return; }
      if (browser.version_added === 'false') { return; }
      if (browser.version_added === 'null') { return; }
      const engine = e.engine;
      if (!engines.includes(engine)) {
        engines.push(engine);
      }
    });
    return engines;
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
      }
    } else {
      burnRecord.bcd = false;
      burnRecord.mdn_exists = false;
    }
    if (!burnRecord.mdn_url) {
      burnRecord.mdn_url = this.getURLByKey(key, trunk);
      // let path = key.replace(".", "/");
      // burnRecord.mdn_url = `${URL_ROOT}${trunk.toUpperCase()}/${path}`;
    }
    return burnRecord;
  }

  getURLByKey(key, trunk = 'api') {
    let path = key.replace(".", "/");
    return `${URL_ROOT}${trunk.toUpperCase()}/${path}`;
  }

}

// module.exports.BCD = BCD;
if (!global.__bcd) { 
  global.__bcd = new BCD();
}
module.exports.bcd = global.__bcd;
module.exports.EMPTY_BURN_RECORD = EMPTY_BURN_RECORD;
