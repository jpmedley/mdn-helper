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
    let files = this.fileSet.files;
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
