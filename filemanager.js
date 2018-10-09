'use strict';

const fs = require('fs');

const API_DIRS = ["core/", "modules/"];

class IDLFileSet() {
  constructor(rootDirectory = 'idl/') {
    this.files = [];
  }

  _loadFiles(rootDirectory) {
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
        contents[c].directory = directory;
        function path() {
          return this.directory + this.name;
        }
        contents[c].path = path;
        path.bind(contents[c]);
        this.files.push(contents[c]);
      }
    }
  }

  findMatching(name) {
    let matches = [];
    let lcName = name.toLowerCase();
    for (let f in this.files) {
      let lcFile = this.files[f].toLowerCase();
      if (lcFile.includes(lcName)) {
        matches.push(this.files[f]);
      }
    }
    return matches;
  }
}

module.exports.IDLFileSet = IDLFileSet;
