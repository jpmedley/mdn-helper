'use strict';

const { bcd } = require('./bcd.js');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
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

async function selectArgument(question, choices) {
  const enq = new Enquirer();
  enq.register('checkbox', cb);
  enq.question('category', question, {
    type: 'checkbox',
    choices: choices
  });
  const answer = await enq.prompt('category');
  return answer.category[0];
}

function _burnerFactory(args) {
  // First three args are no longer needed.
  args.shift();
  args.shift();
  args.shift();
  const burnerType = args[0].toLowerCase();
  switch (burnerType) {
    case 'chrome':

      break;
    case 'bcd':

      break;
    case 'urls':
      args.shift();
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
  }

  async burn() {
    await this._resolveArguments(this._args);
    // START HERE.
  }

  async _resolveArguments(args) {
    // -c css -b chrome
    let argQuestion;
    for (let a in args){
      switch (args[a]) {
        case '-c':
        case '--category':
          if (!CATEGORIES.includes(args[a+1])) {
            argQuestion = `'${args[a]}' is not a valid category.\nWhich category do you want a burn list for/`;
            this._category = await selectArgument(argQuestion, CATEGORIES);
          } else {
            this._category = args[a+1];
          }
          break;
        case '-b':
        case '--browsers':
          this._browsers = args[a+1].split(',');
          const valid = this._browsers.every(arg => {
            arg = arg.trim();
            return BROWSERS.includes(arg);
          });
          if (!valid) {
            argQuestion = 'At least one of the provided browsers is not valid\nWhich browsers do you want a burn list for?';
            this._browsers = await selectArgument(argQuestion, BROWSERS);
          }
        }
      }
    }
  }
}

class ChromeBurner extends Burner {
  constructor(options) {
    super(options);
    //Replace this with this.options.includeFlags;
    //this._includeFlags = false;
  }
}

module.exports.BurnerFactory = _burnerFactory;
