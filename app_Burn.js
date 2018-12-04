'use strict';

// const bcd = require('mdn-browser-compat-data');
const { bcd } = require('./bcd.js');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const fs = require('fs');
const utils = require('./utils.js');
const {
  EMPTY_BCD_DATA,
  EMPTY_BURN_DATA,
  InterfaceData
} = require('./idl.js');
const { Pinger } = require('./pinger.js');

const LOG_FILE = 'burn-log.txt';
const RESULTS_FILE = utils.today() + '-burn-list.csv';
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
]

const EXCLUSIONS = ['inspector/','testing/','typed_arrays/'];

class _Burner {
  constructor() {
    this._includeFlags = false;
    this._resetLog();
    this._outFileHandle;
    this._outFileName = '';
    this._outputLines = 0;
  }

  _closeOutputFile() {
    fs.close(this._outFileHandle, ()=>{});
    let msg;
    if (this._outputLines != 0) {
      let temp = (this._category ? (' for ' + this._category) : '');
      msg = `Burn results${temp} are in ${this._outFileName}.`;
      console.log(msg);
    } else {
      msg = `No missing MDN pages were found for ${this._category}. `;
      msg += 'An output file was not created.'
      console.log(msg);
      fs.unlinkSync(this._outFileName);
    }
  }

  _isExcluded(testFile) {
    // Prevent built-in JS features from being part of api/ (bcd) directory
    // burn down.
    for (let e of EXCLUSIONS) {
      let path = testFile.path();
      if (path.includes(e)) {
        return true;
      }
    }
    return false;
  }

  _openBCDFile(listId, selectedBrowsers) {
    this._outFileName = utils.OUT + listId + '-BCD-' + RESULTS_FILE;
    let file = utils.getOutputFile(this._outFileName);
    let header = 'Interface,' + selectedBrowsers.join(',') + '\n';
    fs.write(file, header, ()=>{});
    this._outFileHandle = file;
  }

  _openURLFile(listID, type) {
    this._outFileName = utils.OUT + listID + "-" + type + "-" + RESULTS_FILE;
    let file = utils.getOutputFile(this._outFileName);
    let header = "Interface,MDN Has Compabibility Data,MDN Page Exists,Expected URL,Redirect\n";
    fs.write(file, header, ()=>{});
    this._outFileHandle = file;
  }

  _recordBCD(records, browsers) {
    for (let r of records) {
      let line = r.key + ',';
      for (let b of browsers) {
        line += (r.browsers[b] + ',');
      }
      line += '\n';
      fs.write(this._outFileHandle, line, ()=>{});
      this._outputLines++;
    }
  }

  _record(records) {
    for (let r of records) {
      if (!r.bcd || !r.mdn_exists) {
        let line = r.key + ',' + r.bcd + ',' + r.mdn_exists;
        if (r.mdn_url) { line += (',' + r.mdn_url); }
        if (r.redirect) { line += (',redirects')}
        line += '\n';
        fs.write(this._outFileHandle, line, ()=>{});
        this._outputLines++;
      }
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

  _log(msg) {
    fs.appendFile(LOG_FILE, msg, (e) => {
      if (e) throw e;
    });
  }

  _getIDLFile(fileName) {
    try {
      let idlFile = new InterfaceData(fileName);
      return idlFile;
    } catch(e) {
      if (e.constructor.name == 'IDLError') {
        let msg = (fileName.path() + "\n\t" + e.message + "\n\n");
        this._log(msg);
        return;
      } else if (e.constructor.name == 'WebIDLParseError') {
        let msg = (fileName.path() + "\n\t" + e.message + "\n\n");
        this._log(msg);
        return;
      } else {
        throw e;
      }
    }
  }

  async burn(args) {
    if (!['bcd','urls','chrome'].includes(args[3])) {
      throw new Error('First burn argument must be one of \'bcd\', \'urls\' or \'chrome\'.');
    }
    this["_" + args[3]](args);
  }

  async _normalizeBCDArguments(args) {
    let result = { 'category': null, 'browsers': [] }
    args = await this._normalizeURLArguments(args);
    result.category = args[5];
    if (!['-b','--browsers'].includes(args[6]) || (args.length < 8)) {
      result.browsers = await this._selectBrowsers();
    }
    for (let i = 7; i < args.length; i++) {
      if (!BROWSERS.includes(args[i])) {
        console.log(`The name ${args[i]} is misspelled or is not a browser in the database.`);
        result.browsers = await this._selectBrowsers();
        break;
      } else {
        result.browsers.push(args[i]);
      }
    }
    return result;
  }

  async _normalizeURLArguments(args) {
    this._category;
    if (!['-c', '--category'].includes(args[4])) {
      args.push('-c');
      // this._category = await this._selectGroup();
      // args.push(this._category);
    }
    if (args.length < 6) {
      this._category = await this._selectGroup();
      args.push(this._category);
    }
    if (!CATEGORIES.includes(args[5])) {
      console.log(`Burn downs for the ${args[5]} category are not supported. `);
      args.pop();
      this._category = await this._selectGroup();
      args.push(this._category);
    }
    return args;
  }

  async _selectBrowsers() {
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('browsers', 'Which browsers do you want a burn list for?', {
      type: 'checkbox',
      choices: BROWSERS
    });
    let answers = await enq.prompt('browsers');
    return answers.browsers;
  }

  async _selectGroup() {
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('category', 'Which category do you want a burn list for?', {
      type: 'checkbox',
      choices: CATEGORIES
    });
    let answer = await enq.prompt('category');
    return answer.category[0];
  }

  _getBurnRecords(urlData) {
    let records = [];
    (function getRecords(data) {
      for (let d in data) {
        if (d == '__parent') { continue; }
        if (d == '__name') { continue; }
        if (!data[d].__compat) {
          getRecords(data[d]);
        } else {
          if (!data[d].__compat.mdn_url) { continue; }
          let record = Object.assign({}, EMPTY_BURN_DATA);
          record.key = d;
          record.bcd = true;
          record.mdn_exists = false;
          record.mdn_url = data[d].__compat.mdn_url;
          records.push(record);
        }
      }
    })(urlData);
    return records;
  }

  _getNewRecord(data, browsers) {
    let d = data.__parent;
    let keys = [];
    do {
      keys.splice(0, 0, d.__name);
      d = d.__parent;
    } while (d.__parent);
    let key = keys.join('.');
    let record = { key: key, browsers: {} };
    for (let b of browsers) {
      if (!data.support[b]) {
        record.browsers[b] = 'missing';
      }
    }
    for (let d in data.support) {
      if (!browsers.includes(d)) { continue; }
      if (data.support[d].version_added==null) {
        record.browsers[d] = 'missing';
      } else {
        record.browsers[d] = data.support[d].version_added;
      }
    }
    return record;
  }

  _getBCDBurnRecords(categoryData) {
    let records = [];
    let bcdData = bcd[categoryData.category];
    (function getRecords(data) {
      for (let d in data) {
        if (d == '__parent') { continue; }
        if (d == '__compat') {
          let record = this._getNewRecord(data[d], categoryData.browsers);
          console.log(record.key);
          records.push(record);
        } else {
          if ((typeof data[d]) != 'object') { continue; }
          getRecords.call(this, data[d]);
        }
      }
    }).call(this, bcdData);
    return records;
  }

  async _bcd(args) {
    args = await this._normalizeBCDArguments(args);
    this._openBCDFile(args.category, args.browsers);
    console.log(`Checking BCD data for missing ${args.category} data. `);
    let burnRecords = this._getBCDBurnRecords(args);
    this._recordBCD(burnRecords, args.browsers);
    this._closeOutputFile();
  }

  async _urls(args) {
    args = await this._normalizeURLArguments(args);
    this._openURLFile(args[5], 'urls');
    console.log(`Checking for MDN pages for ${args[5]} data.`);
    let burnRecords = this._getBurnRecords(bcd[args[5]]);
    let pinger = new Pinger(burnRecords);
    burnRecords = await pinger.pingRecords(true)
    .catch(e => {
      throw e;
    });
    this._record(burnRecords);
    this._closeOutputFile();
  }

  async _chrome(args) {
    if (['-f', '--flags'].includes(args[4])) { this._includeFlags = true; }
    this._openURLFile(args[3]);
    this._category = args[3];
    let fileSet = new fm.IDLFileSet();
    let files = fileSet.files;
    console.log('Looking for browser compatibility data and MDN pages.');
    for (let f in files) {
      if (this._isExcluded(files[f])) { continue; }
      let idlFile = this._getIDLFile(files[f]);
      if (!idlFile) { continue; }
      let burnRecords = idlFile.getBurnRecords(this._includeFlags);
      if (!burnRecords) { continue; }
      let pinger = new Pinger(burnRecords);
      burnRecords = await pinger.pingRecords()
      .catch(e => {
        throw e;
      });
      this._record(burnRecords);
    }
    this._closeOutputFile();
  }
}

module.exports.Burner = _Burner;
