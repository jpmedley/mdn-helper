'use strict';

const fs = require('fs');

const API_DIRS = ["_test/", "core/", "modules/"];

class IDLFileSet {
  constructor(rootDirectory = 'idl/') {
    this._files = [];
    this._loadFiles(rootDirectory);
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
