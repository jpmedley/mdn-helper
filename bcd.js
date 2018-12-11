'use strict';

const bcd = require('mdn-browser-compat-data');

// const SKIPABLE = ['browsers','description','mathml','mdn_url','webdriver','webextensions','xpath','xslt','__parent'];

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
    return bcd;
  }

  _decorate(data) {
    let keys = Object.keys(data);
    if (keys.length) {
      for (let k of keys) {
        // if (k == '__compat') { continue; }
        if (!data[k]) { continue; }
        // if (SKIPABLE.includes(k)) { continue; }
        if (k == '__parent') { continue; }
        if (typeof data[k] != 'object') { continue; }
        data[k].__parent = data;
        data[k].__name = k;
        this._decorate(data[k]);
      }
    }
  }

  getPossibleKeys(withString) {
    let results = new Array();
    const NOT_KEYS = ['__compat','__name','__parent'];
    (function getKeys(tree, results) {
      let keys = Object.keys(tree);
      if (!keys.length) { throw new Error(); }
      for (let k in tree) {
        if (NOT_KEYS.includes(k)) { continue; }
        // console.log(generateFullKey(tree[k]));
        results.push(generateFullKey(tree[k]));
      }
    })(this, results);
    return results;

    // let keys = Object.keys(this);
    // if (!keys.length) { throw new Error(); }
    // (function getKeys(keys) {
    //   for (let k of keys) {
    //     if (NOT_KEYS.includes(k)) { continue; }
    //     // possibleKeys.push(this._generateFullKey(k));
    //     console.log(generateFullKey(keys[k]));
    //     getKeys(k);
    //   }
    // })(keys);
  }


}

module.exports.bcd = new BCD();
