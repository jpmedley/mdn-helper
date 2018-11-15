'use strict';

const bcd = require('mdn-browser-compat-data');

// const SKIPABLE = ['browsers','description','mathml','mdn_url','webdriver','webextensions','xpath','xslt','__parent'];

class BCD {
  constructor() {
    this._decorate(bcd);
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
}

module.exports.bcd = new BCD();
