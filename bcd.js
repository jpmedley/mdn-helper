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

module.exports.bcd = new BCD();
