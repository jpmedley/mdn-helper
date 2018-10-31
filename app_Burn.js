'use strict';

const bcd = require('mdn-browser-compat-data');
const fm = require('./filemanager.js');
const fs = require('fs');
const { InterfaceData } = require('./idl.js');

const LOG_FILE = 'burn-log.txt';

class Burn {
  constructor() {
    this.fileSet = new fm.IDLFileSet();
    this._clearLog();
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

  burn() {
    let files = this.fileSet.files;
    let idlFile = null;
    for (let f in files) {
      try {
        idlFile = new InterfaceData(files[f]);
      } catch(e) {
        if (e.constructor.name == 'IDLError') {
          let msg = (files[f].path() + "\n\t" + e.message + "\n\n");
          this._log(msg);
          continue;
        } else if (e.constructor.name == 'WebIDLParseError') {
          let msg = (files[f].path() + "\n\t" + e.message + "\n\n");
          this._log(msg);
          continue;
        } else {
          throw e;
        }
      }

      let keys = idlFile.keys;
      for (let k in keys) {
        let tokens = keys[k].split('.');
        let data = bcd.api[tokens[0]];
        if (data && tokens.length > 1) {
          data = bcd.api[tokens[0]][tokens[1]];
        }
        let record;
        if (!data) {
          record = keys[k] + ",false,false";
        } else {
          record = keys[k] + ",true,";
          if (data.__compat) {
            record += data.__compat.mdn_url;
          } else {
            record += false;
          }
        }
        console.log(record);

      }
    }
  }
}

module.exports.Burn = Burn;
