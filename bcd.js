'use strict';

const bcd = require('mdn-browser-compat-data');

// const SKIPABLE = ['browsers','description','mathml','mdn_url','webdriver','webextensions','xpath','xslt','__parent'];

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

  _generateFullKey(currentKey) {
    let resultArray = new Array();
    do {
      resultArray.push(currentKey.__name);
      currentKey = currentKey.__parent;
    } while (currentKey.__parent);
    resultArray = resultArray.reverse();
    const result = resultArray.join('.');
    return result;
  }

  getPossibleKeys(withString) {
    let possibleKeys = new Array();
    const NOT_KEYS = ['__compat','__name','__parent'];
    let keys = Object.keys(this);
    if (!keys.length) { throw new Error(); }
    (function getKeys() {
      for (let k of keys) {
        if (NOT_KEYS.includes(k)) { continue; }
        possibleKeys.push(this._generateFullKey(k));
        getKeys();
      }
    })();


    // let keys = Object.keys(this.api.XSLTProcessor);
    // if (!keys.length) { throw new Error(); }
    // for (let k of keys) {
    //   console.log(k);
    // }
  }
}

module.exports.bcd = new BCD();
