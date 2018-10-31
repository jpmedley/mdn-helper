'use strict';

const fm = require('./filemanager.js');
const fs = require('fs');
const utils = require('./utils.js');
const { InterfaceData } = require('./idl.js');
const { Pinger } = require('./pinger.js');
const { Redirects } = require('./redirects.js');

const LOG_FILE = 'burn-log.txt';
const RESULTS_FILE = 'burn-list.csv';

const HTTP_OPTIONS = {
  protocol: 'https:',
  host: 'developer.mozilla.org',
  path: ''
}

class Burn {
  constructor() {
    this._clearLog();
    this._fileSet = new fm.IDLFileSet();
    this._outputFile = utils.getOutputFile(RESULTS_FILE);
    this._pinger = new Pinger(HTTP_OPTIONS);

    this._pinger.addListener('needsretry', (record) => {
      if (record.retry > 0) {
        record.retry--;
        this._nextTest();
      }
    });

    this._pinger.addListener('missing', (record) => {
      record.mdn_exists = false;
      this._nextTest();
    });

    this._pinger.addListener('found', (record) => {
      record.mdn_exists = true;
      this._nextTest();
    })
  }

  _nextTest() {
    // START HERE: loop until record.mdn_exists all have values.
  }

  _clearLog() {
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

  burn() {
    let files = this._fileSet.files;
    let idlFile = null;
    for (let f in files) {
      let idlFile = this._getIDLFile(files[f]);
      if (!idlFile) { continue; }
      let burnRecords = idlFile.burnRecords;
      for (let b in burnRecords) {
        console.log(burnRecords[b].key + "," + burnRecords[b].bcd + "," + burnRecords[b].mdn_exists);
      }
    }
  }
}

module.exports.Burn = Burn;
