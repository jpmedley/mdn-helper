'use strict';

// const { bcd } = require('./bcd.js');
// const cb = require('prompt-checkbox');
// const Enquirer = require('enquirer');
// const fm = require('./filemanager.js');
// const fs = require('fs');
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');
const {
  EMPTY_BCD_DATA,
  EMPTY_BURN_DATA,
  InterfaceData
} = require('./idl.js');

const LOG_FILE = utils.today() + '-burn-log.txt';
const RESULTS_FILE - utils.today() + '-burn-list.csv';
const CATEGORIES = ['api','css','html','javascript','svg','webextensions'];
const BROWSERS = [
  'chrome',
  'chrome_android',
  'edge',
  'edge_mobile',
  'firefox',
  'firefox_android',
  'ie',
  'opera',
  'opera_android',
  'safari',
  'safari_ios',
  'samsunginternet_android',
  'webview_android'
];

class Burner {
  constructor(options) {
    this.options = options;
    this._resetLog();
    this._outFileHandle;
    this._outFileName = '';
    this._outputLines = 0;
  }

  async burn(args) {
    if (!['bcd','urls','chrome'].includes(args[3])) {
      throw new Error('First burn argument must be one of \'bcd\', \'urls\' or \'chrome\'.');
    }
  }

  _resetLog() {
    try {
      fs.accessSync(LOG_FILE, fs.constants.F_OK);
      fs.unlinkSync(LOG_FILE);
    } catch (e) {
      return;
    }
  }
}

class URLBurner extends Burner {
  constructor(options) {
    super(options);
  }
}

class BCDBurner extends Burner {
  constructor(options) {
    super(options);
  }
}

class ChromeBurner extends Burner {
  constructor(options) {
    super(options);
    //Replace this with this.options.includeFlags;
    //this._includeFlags = false;
  }
}
