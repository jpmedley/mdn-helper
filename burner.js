'use strict';

const { bcd } = require('./bcd.js');
const cb = require('prompt-checkbox');
const config = require('config');
const Enquirer = require('enquirer');
const { IDLFileSet } = require('./filemanager.js');
const fs = require('fs');
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');
const {
  EMPTY_BCD_DATA,
  EMPTY_BURN_DATA,
  InterfaceData
} = require('./idl.js');

const ALL_STRING = '(all)';
const BURNABLE_TYPES = ['interface'];
const LOG_FILE = utils.today() + '-burn-log.txt';
const CATEGORIES = ['api','css','html','javascript','svg','webextensions'];
const TEST_MODE = config.get('Application.test');
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
  'webview_android',
];


function getBurnRecords(key) {
  // const urlData = bcd[key];
  const urlData = bcd.getByKey(key);
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
  let eMsg = 'Burner type must be one of \'bcd\', \'chrome\', or \'urls\'.'
  if (!args[0]) {
    eMsg = 'You must provide a buner type. ' + eMsg;
    throw new Error(eMsg);
  }
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
      eMsg = 'Burner type is invalid or misspelled. ' + eMsg;
      throw new Error(eMsg);
  }
}

class Burner {
  constructor(options) {
    // this.options = options;
    this._args = options.args;
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

  _log(msg) {
    fs.appendFile(this._logFile, msg, (e) => {
      if (e) throw e;
    });
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
    let burnRecords = getBurnRecords(this._category);
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
    const today = utils.today();
    const folderName = `burn_${today}`;
    this._outputPath = utils.makeOutputFolder(folderName);
    this._logFile = this._outputPath + LOG_FILE;
    this._outFileName = `${this._outputPath}${this._category}-${this._type}-burnlist_${today}.csv}`
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
    const today = utils.today();
    const folderName = `burn_${today}`;
    this._outputPath = utils.makeOutputFolder(folderName);
    this._logFile = this._outputPath + LOG_FILE;
    this._outFileName = `${this._outputPath}${this._category}-${this._type}-burnlist_${today}.csv`;
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

    if (!this._browsers) {
      // Interactive path
      await this._selectBrowser();
    } else {
      // Command line path
      if (!this._browsers.every(browser => {
        return BROWSERS.includes(browser);
      })) {
        console.log('At least one of the provided browsers is not valid\n'); await this._selectBrowser();
      }
    }
  }

  async _selectBrowser() {
    let inValid = true;
    let argQuestion = 'Which browsers do you want a burn list for?';
    const selectionList = [ALL_STRING, ...BROWSERS];
    while (inValid) {
      this._browsers = await selectArgument(argQuestion, selectionList, true);
      if (this._browsers == ALL_STRING) {
        this._browsers = BROWSERS;
        inValid = false
      } else if (this._browsers.includes(ALL_STRING)) {
        argQuestion = `Selecting both ${ALL_STRING} and another browser is an invalid choice.\n`+ argQuestion;
      } else if (this._browsers.every(browser=>{
        return BROWSERS.includes(browser);
      })) {
        inValid = false;
      }
    }
  }
}

class ChromeBurner extends Burner {
  constructor(options) {
    super(options);
    this._includeFlags = false;
    this._includeOriginTrials = false;
    this._includeTestFlags = false;
  }

  async burn() {
    await this._resolveArguments(this._args);
    this._openResultsFile();
    let idlFiles = new IDLFileSet();
    let files = idlFiles.files
    console.log('Looking for browser compatibility data and MDN pages.');
    for (let f of files) {
      let idlFile = this._getIDLFile(f);
      if (!this._isBurnable(idlFile)) { continue; }
      let burnRecords = idlFile.getBurnRecords({
        includeFlags: this._includeFlags,
        includeOriginTrials: this._includeOriginTrials
      });
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

  _isBurnable(idlFile) {
    if (!idlFile) { return false; }
    if (!BURNABLE_TYPES.includes(idlFile._type)) { return false; }
    if (!this._includeFlags && idlFile.flagged) { return false; }
    if (!this._includeTestFlags && (idlFile.flag === 'test')) { return false; }
    if (!this._includeOriginTrials && idlFile.originTrial) { return false; }
    return true;
  }

  _getIDLFile(fileName) {
    try {
      let idlFile = new InterfaceData(fileName, {
        experimental: this._includeFlags,
        originTrials: this._includeOriginTrials
      });
      return idlFile;
    } catch(e) {
      if (TEST_MODE) { throw e; }
      switch (e.constructor.name) {
        case 'IDLError':
        case 'IDLNotSupportedError':
        case 'WebIDLParseError':
          let msg = (fileName.path() + "\n\t" + e.message + "\n\n");
          this._log(msg);
          return;
          break;
        default:
          throw e;
      }
    }
  }

  _openResultsFile() {
    const today = utils.today();
    const folderName = `burn_${today}`;
    this._outputPath = utils.makeOutputFolder(folderName);
    this._logFile = this._outputPath + LOG_FILE;
    this._outFileName = `${this._outputPath}chrome-burnlist_${today}.csv`;
    this._outFileHandle = utils.getOutputFile(this._outFileName);
    let header = 'Interface,MDN Has Compabibility Data,MDN Page Exists,Expected URL,Redirect';
    if (this._includeFlags) { header += ',Behind a Flag'; }
    if (this._includeOriginTrials) { header += ',In Origin Trial'; }
    header += '\n';
    fs.write(this._outFileHandle, header, ()=>{});
  }

  _record(records) {
    for (let r of records) {
      if (!r.bcd || !r.mdn_exists) {
        let line = `${r.key},${r.bcd},${r.mdn_exists},${r.mdn_url}`;
        if (this._includeFlags) { line += `,${r.flag}`; }
        if (this._includeOriginTrials) { line += `,${r.origin_trial}`; }
        line += '\n';
        fs.write(this._outFileHandle, line, ()=>{});
        this._outputLines++;
      }
    }
  }

  async _resolveArguments(args) {
    this._includeFlags = args.some(arg=>{
      return (arg.includes('-f') || (arg.includes('--flags')));
    });
    this._includeOriginTrials = args.some(arg=>{
      return (arg.includes('-o') || (arg.includes('--origin-trials')));
    });
  }
}

module.exports.BurnerFactory = _burnerFactory;
