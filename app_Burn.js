'use strict';

const fm = require('./filemanager.js');
const { InterfaceData } = require('./idl.js');

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
        // idlFile = new idl.InterfaceData(files[f]);
        idlFile = new InterfaceData(files[f]);
      } catch(e) {
        if (e.constructor.name == 'IDLError') {
          console.log('\t' + e.message);
          continue;
        } else if (e.constructor.name == 'WebIDLParseError') {
          console.log('\t' + e.message);
          continue;
        } else {
          console.log('\t' + e.name);
          console.log('\t' + e.stack);
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
