'use strict';

const fs = require('fs');
const { InterfaceData } = require('./idl.js');

const API_DIRS = ["_test/", "core/", "modules/"];

class IDLFileSet {
  constructor(rootDirectory = 'idl/') {
    this._files = [];
    this._rootDirectory = rootDirectory;
    this._loadFiles();
  }

  _loadFiles(rootDirectory = this._rootDirectory) {
    for (let d in API_DIRS) {
      let dir = rootDirectory + API_DIRS[d];
      this._processDirectory(dir);
    }
  }

  _processDirectory(rootDirectory) {
    let contents = fs.readdirSync(rootDirectory, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        this._processDirectory(rootDirectory + contents[c].name + "/");
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        contents[c].directory = rootDirectory;
        function path() {
          return this.directory + this.name;
        }
        contents[c].path = path;
        path.bind(contents[c]);
        contents[c].index = new Array();
        let idlFile = this._getIDLFile(contents[c]);
        if (idlFile) {
          contents[c].key = idlFile.name;
          contents[c].index.push(idlFile.name.toLowerCase());
          // For now, only deal with interface names.
          // for (let m of idlFile.members) {
          //   contents[c].index.push(idlFile.name + '.' + m.name);
          // }
        }
        this._files.push(contents[c]);
      }
    }
  }

  get files() {
    return this._files;
  }

  _getIDLFile(fileObject) {
    try {
      let idlFile = new InterfaceData(fileObject);
      return idlFile;
    } catch (e) {
      if (e.constructor.name == 'IDLError') {
        return;
      } else if (e.constructor.name == 'WebIDLParseError') {
        return;
      } else {
        throw e;
      }
    }
  }

  findMatching(name) {
    let matches = [];
    let lcName = name.toLowerCase();
    for (let f of this._files) {
      if (f.index.length == 0) { continue; }
      if (f.index[0].includes(lcName)) {
        matches.push(f);
      }
    }
    return matches;
  }
}

module.exports.IDLFileSet = IDLFileSet;
