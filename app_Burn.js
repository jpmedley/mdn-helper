'use strict';

const bcd = require('mdn-browser-compat-data');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const fs = require('fs');
const utils = require('./utils.js');
const { EMPTY_BURN_DATA, InterfaceData } = require('./idl.js');
const { Pinger } = require('./pinger.js');

const LOG_FILE = 'burn-log.txt';
const RESULTS_FILE = 'burn-list.csv';
const CATEGORIES = ['api','css','html','javascript','svg'];


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
      msg = `Burn result for ${this._category} are in ${this._outFileName}.`;
      console.log(msg);
    } else {
      msg = `No missing MDN pages were found for ${this._category}. `;
      msg += 'An output file was not created.'
      console.log(msg);
      fs.unlinkSync(this._outFileName);
    }
  }

  _openOutputFile(listID) {
    this._outFileName = utils.OUT + listID + "-" + RESULTS_FILE;
    let file = utils.getOutputFile(this._outFileName);
    let header = "Interface,Has BCD,Has MDN Page,Expected URL,Redirect\n";
    fs.write(file, header, ()=>{});
    this._outFileHandle = file;
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
    if (!['bcd','chrome'].includes(args[3])) {
      throw new Error('First burn argument must be one of \'bcd\' or \'chrome\'.');
    }
    this["_" + args[3]](args);
  }

  async _normalizeArguments(args) {
    this._category;
    if (!['-d', '--datafor'].includes(args[4])) {
      args.push('-d');
      this._category = await this._selectGroup();
      args.push(this._category);
    }
    if (args.length < 6) {
      this._category = await this._selectGroup();
      args.push(this._category);
    }
    if (!CATEGORIES.includes(args[5])) {
      console.log(`Burn downs for the ${args[5]} category are not supported. `);
      args.pop();
      this._category = await this._selectGroup();
      args.push(this._category)
    }
    return args;
  }

  async _selectGroup() {
    const enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('category', 'Which category do you want a burn list for?', {
      type: 'checkbox',
      choices: CATEGORIES
    });
    let answer = await enq.prompt('category');
    console.log(answer.category[0]);
    return answer.category[0];
  }

  _getBurnRecords(bcdData) {
    let records = [];
    (function getRecords(data) {
      for (let d in data) {
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
    })(bcdData);
    return records;
  }

  async _bcd(args) {
    args = await this._normalizeArguments(args);
    this._openOutputFile(args[5]);
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
    this._openOutputFile(args[3]);
    this._category = args[3];
    let fileSet = new fm.IDLFileSet();
    let files = fileSet.files;
    console.log('Looking for browser compatibility data and MDN pages.');
    for (let f in files) {
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
