'use strict';

const fm = require('./filemanager.js');
const fs = require('fs');
const utils = require('./utils.js');
const { InterfaceData } = require('./idl.js');
const { Pinger } = require('./pinger.js');

const LOG_FILE = 'burn-log.txt';
const RESULTS_FILE = 'burn-list.csv';


class Burn {
  constructor() {
    this._clearLog();
    this._fileSet = new fm.IDLFileSet();
    // this._outputFile = utils.getOutputFile(RESULTS_FILE);
    this._outputFile = (() => {
      let file = utils.getOutputFile(RESULTS_FILE);
      let header = "Interface,Has BCD,Has MDN Page,Expected URL\n";
      fs.write(file, header, ()=>{});
      return file;
    })();

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

  _record(records) {
    for (let r in records) {
      let line = records[r].key + "," + records[r].bcd + "," + records[r].mdn_exists;
      if (records[r].mdn_url) {
        line += "," + records[r].mdn_url;
      }
      line += "\n";
      if (records[r].bcd != true) {
        fs.write(this._outputFile, line, ()=>{});
      }
    }
  }

  burn() {
    let files = this._fileSet.files;
    // for (let f in files) {
    //   let idlFile = this._getIDLFile(files[f]);
      let idlFile = this._getIDLFile(files[1]);
      // if (!idlFile) { continue; }
      let burnRecords = idlFile.burnRecords;
      let pinger = new Pinger(burnRecords);
      burnRecords = pinger.pingRecords();
      this._record(burnRecords);
    // }
    fs.close(this._outputFile, ()=>{});
  }
}

module.exports.Burn = Burn;
