'use strict';

const fm = require('./filemanager.js');
const idl = require('./idl.js');

class Burn {
  constructor() {
    this.fileSet = new fm.IDLFileSet();
  }

  burn() {
    let files = this.fileSet.files;
    let idlFile = null;
    let ids = null;
    for (let f in files) {
      try {
        console.log(">>>" + files[f].path());
        idlFile = new idl.InterfaceData(files[f])
      } catch(e) {
        if (e.constructor.name == 'WebIDLParseError') {
          continue;
        } else {
          throw e;
        }
      }


      // idlFile = new idl.InterfaceData(files[f]);
      ids = idlFile.keys;
      for (let i in ids) {
        console.log(ids[i]);
      }
    }
  }
}

module.exports.Burn = Burn;
