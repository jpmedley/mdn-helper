'use strict';

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
    let ids = null;
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

      ids = idlFile.interfaces;
      for (let i in ids) {
        console.log(ids[i]);
      }
    }
  }
}

module.exports.Burn = Burn;
