'use strict';

const fm = require('./filemanager.js');
const fs = require('fs');
const utils = require('./utils.js');
const { InterfaceData } = require('./idl.js');
const { Pinger } = require('./pinger.js');

const LOG_FILE = 'burn-log.txt';
const RESULTS_FILE = 'burn-list.csv';


class _Burner {
  constructor() {
    this._includeFlags = false;
    this._resetLog();
    this._fileSet = new fm.IDLFileSet();
    this._outputFile = (() => {
      let file = utils.getOutputFile(RESULTS_FILE);
      let header = "Interface,Has BCD,Has MDN Page,Expected URL,Redirect\n";
      fs.write(file, header, ()=>{});
      return file;
    })();

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

  _record(records) {
    for (let r of records) {
      if (!r.bcd || !r.mdn_exists) {
        let line = r.key + ',' + r.bcd + ',' + r.mdn_exists;
        if (r.mdn_url) { line += (',' + r.mdn_url); }
        if (r.redirect) { line += (',redirects')}
        line += '\n';
        fs.write(this._outputFile, line, ()=>{});
      }
    }
  }

  async burn(args) {
    if (['-f', '--flags'].includes(args[3])) { this._includeFlags = true; }
    let files = this._fileSet.files;
    console.log('Looking for browser compatibility data and MDN pages.');
    for (let f in files) {
      console.log('\t' + files[f].name);
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
    fs.close(this._outputFile, ()=>{});
  }
}

module.exports.Burner = _Burner;
