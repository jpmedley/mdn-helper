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
        this._files.push(contents[c]);
      }
    }
  }

  get files() {
    return this._files;
  }

  indexIDL() {
    const indexPath = this._rootDirectory + 'idlindex.txt';
    if (fs.existsSync(indexPath)) { fs.unlinkSync(indexPath)}
    let idls = this.files;
    for (let i of idls) {
      try {
        let idlFile = new InterfaceData(i);
        fs.appendFileSync(indexPath, (idlFile.name + ',' + i.path() + '\n'));
        for (let m of idlFile.members) {
          fs.appendFileSync(indexPath, (idlFile.name + '.' + m.name + ',' + i.path() + '\n'));
        }
      } catch (e) {
        if (e.constructor.name == 'IDLError') {
          let msg = (i.path() + "\n\t" + e.message + "\n\n");
          console.log(msg);
          return;
        } else if (e.constructor.name == 'WebIDLParseError') {
          let msg = (i.path() + "\n\t" + e.message + "\n\n");
          console.log(msg);
          return;
        } else {
          throw e;
        }
      }finally {
        continue;
      }
    }
  }

  findMatching(name) {
    let matches = [];
    let lcName = name.toLowerCase();
    for (let f in this._files) {
      let lcFile = this._files[f].name.toLowerCase();
      if (lcFile.includes(lcName)) {
        matches.push(this._files[f]);
      }
    }
    return matches;
  }
}

module.exports.IDLFileSet = IDLFileSet;
