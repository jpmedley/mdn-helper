'use strict';

const { bcd } = require('./bcd.js');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const { IDLFileSet } = require('./filemanager.js');
// const fm = require('./filemanager.js');
const fs = require('fs');
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');
const {
  EMPTY_BCD_DATA,
  EMPTY_BURN_DATA,
  InterfaceData
} = require('./idl.js');

const LOG_FILE = utils.today() + '-burn-log.txt';
// const RESULTS_FILE = utils.today() + '-burn-list.csv';
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

async function selectArgument(question, choices, returnAll= false) {
  const enq = new Enquirer();
  enq.register('checkbox', cb);
  enq.question('chose', question, {
    type: 'checkbox',
    choices: choices
  });
  const answer = await enq.prompt('chose');
  if (returnAll) { return answer.chose; }
  else { return answer.chose[0]; }

  return answer.category[0];
}

function _burnerFactory(args) {
  // First three args are no longer needed.
  args.shift();
  args.shift();
  args.shift();
  const burnerType = args[0].toLowerCase();
  args.shift();
  switch (burnerType) {
    case 'chrome':
      return new ChromeBurner({ args: args });
      break;
    case 'bcd':
      return new BCDBurner({ args: args });
      break;
    case 'urls':
      return new URLBurner({ args: args });
      break;
    default:
      throw new Error('First burn argument must be one of \'bcd\', \'urls\' or \'chrome\'.');
  }
}

class Burner {
  constructor(options) {
    // this.options = options;
    this._args = options.args;
    this._resetLog();
    this._outFileHandle;
    this._outfileName
    this._outputLines = 0;
    this._type;
    this._category;
  }

  _closeOutputFile() {
    fs.close(this._outFileHandle, ()=>{});
    let msg;
    if (this._outputLines != 0) {
      let temp = (this._category ? (' for ' + this._category) : '');
      msg = `Burn results${temp} are in ${this._outFileName}.`;
    } else {
      msg = `No missing MDN pages were found for ${this._category}. `;
      msg += 'An output file was not created.';
      fs.unlinkSync(this._outFileName);
    }
    console.log(msg);
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
    this._type = 'url';
  }

  async burn() {
    await this._resolveArguments(this._args);
    this._openResultsFile();
    console.log('Pinging MDN for known URLs.');
    let burnRecords = this._getBurnRecords();
    const pinger = new Pinger(burnRecords);
    const verboseOutput = true;
    //This should be pingURLs().
    burnRecords = await pinger.pingRecords(verboseOutput)
    .catch(e => {
      throw e;
    });
    this._record(burnRecords);
    this._closeOutputFile();
  }

  _getBurnRecords() {
    const urlData = bcd[this._category];
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

  _record(records) {
    for (let r of records) {
      if (!r.bcd || !r.mdn_exists) {
        let line = r.key + ',' + r.bcd + ',' + r.mdn_exists;
        if (r.mdn_url) { line += (',' + r.mdn_url); }
        if (r.redirect) { line += (',redirects'); }
        line += '\n';
        fs.write(this._outFileHandle, line, ()=>{});
        this._outputLines++;
      }
    }
  }

  async _resolveArguments(args) {
    const catQuestion = 'Which category do you want a burn list for?'
    if (args.length < 2) {
      this._category = await selectArgument(catQuestion, CATEGORIES);
    } else {
      if (!CATEGORIES.includes(args[1])) {
        console.log(`${args[1]} is not a valid category.\n`);
        this._category = await selectArgument(catQuestion, CATEGORIES);
      } else {
        this._category = args[1];
      }
    }
  }

  _openResultsFile(listID) {
    const folderName = 'burn_' + utils.today() + '/';
    utils.makeOutputFolder(folderName);
    const path = utils.OUT + folderName;
    this._outFileName = path + this._category + '-' + this._type + '-burn-list_' + utils.today() + '.csv';
    this._outFileHandle = utils.getOutputFile(this._outFileName);
    const header = 'Interface,MDN Has Compabibility Data,MDN Page Exists,Expected URL,Redirect\n';
    fs.write(this._outFileHandle, header, ()=>{});
  }
}

class BCDBurner extends Burner {
  constructor(options) {
    super(options);
    this._browsers;
    this._type = 'bcd';
  }

  async burn() {
    await this._resolveArguments(this._args);
    this._openResultsFile();
    console.log(`Checking BCD data for missing ${this._category} data.`);
    let burnRecords = this._getBCDBurnRecords();
    this._recordBCD(burnRecords);
    this._closeOutputFile();
  }

  _getBCDBurnRecords() {
    let records = [];
    let bcdData = bcd[this._category];
    (function getRecords(data) {
      for (let d in data) {
        if (d == '__parent') { continue; }
        if (d == '__compat') {
          let record = this._getNewRecord(data[d], this._browsers);
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

  _openResultsFile(listId) {
    const folderName = 'burn_' + utils.today() + '/';
    utils.makeOutputFolder(folderName);
    const path = utils.OUT + folderName;
    this._outFileName = path + this._category + '-' + this._type + '-burn-list_' + utils.today() + '.csv';
    this._outFileHandle = utils.getOutputFile(this._outFileName);
    let header = 'Interface,' + this._browsers.join(',') + '\n';
    fs.write(this._outFileHandle, header, ()=>{});
  }

  _recordBCD(records) {
    for (let r of records) {
      let line = r.key + ',';
      for (let b of this._browsers) {
        line += (r.browsers[b] + ',');
      }
      line += '\n';
      fs.write(this._outFileHandle, line, ()=>{});
      this._outputLines++;
    }
  }

  async _resolveArguments(args) {
    // -c css -b chrome
    let pos;
    pos = args.indexOf('-c');
    if (pos > -1) { this._category = args[pos + 1]; }
    pos = args.indexOf('--category');
    if (pos > -1) { this._category = args[pos + 1]; }

    let argQuestion = 'Which category do you want a burn list for?';
    if (!this._category) {
      this._category = await selectArgument(argQuestion, CATEGORIES);
    }
    if (!CATEGORIES.includes(this._category)) {
      argQuestion = `${this._category} is not a valid category.\n` + argQuestion;
      this._category = await selectArgument(argQuestion, CATEGORIES);
    }

    pos = args.indexOf('-b');
    if (pos > -1) { this._browsers = args[pos + 1].split(','); }
    pos = args.indexOf('--browsers');
    if (pos > -1) { this._browsers = args[pos + 1].split(','); }

    argQuestion = 'Which browsers do you want a burn list for?';
    if (!this._browsers) {
      this._browsers = await selectArgument(argQuestion, BROWSERS, true);
    }
    if (!this._browsers.every(browser => {
      return BROWSERS.includes(browser);
    })) {
      argQuestion = 'At least one of the provided browsers is not valid\n' + argQuestion;
      this._browsers = await selectArgument(argQuestion, BROWSERS, true);
    }
  }
}

class ChromeBurner extends Burner {
  constructor(options) {
    super(options);
    //Replace this with this.options.includeFlags;
    this._includeFlags = false;
  }

  async burn() {
    await this._resolveArguments(this._args);
    this._openResultsFile();
    let idlFiles = new IDLFileSet();
    let files = idlFiles.files;
    console.log('Looking for browser compatibility data and MDN pages.');
    for (let f of files) {
      let idlFile = this._getIDLFile(f);
      if (!idlFile) { continue; }
      if (idlFile._type != 'interface') { continue; }
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

  _openResultsFile() {
    const folderName = 'burn_' + utils.today() + '/';
    utils.makeOutputFolder(folderName);
    const path = utils.OUT + folderName;
    this._outFileName = path + 'chrome-burn-list_' + utils.today() + '.csv';
    this._outFileHandle = utils.getOutputFile(this._outFileName);
    const header = 'Interface,MDN Has Compabibility Data,MDN Page Exists,Expected URL,Redirect\n';
    fs.write(this._outFileHandle, header, ()=>{});
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

  async _resolveArguments(args) {
    this._includeFlags = args.some(arg=>{
      return (arg.includes('-f') || (arg.includes('--flags')));
    })
  }
}

module.exports.BurnerFactory = _burnerFactory;
