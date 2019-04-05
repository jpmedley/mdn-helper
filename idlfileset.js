'use strict';

const fs = require('fs');
const config = require('config');
const { InterfaceData } = require('./idl.js');

const API_DIRS = ["core/", "modules/"];
const TEST_DIRS = ["_test/"];
const EXCLUSIONS = ['inspector','testing','typed_arrays'];
const TEST_MODE = config.get('Application.test');

class IDLFileSet {
  constructor(rootDirectory = 'idl/') {
    this._files = [];
    this._rootDirectory = rootDirectory;
    this._loadFiles();
  }

  _loadFiles(rootDirectory = this._rootDirectory) {
    let dir;
    if (TEST_MODE) {
      for (let d of TEST_DIRS) {
        dir = rootDirectory + d;
        this._processDirectory(dir);
      }
    }
    for (let d of API_DIRS) {
      dir = rootDirectory + d;
      this._processDirectory(dir);
    }
  }

  _processDirectory(rootDirectory) {
    let contents = fs.readdirSync(rootDirectory, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (EXCLUSIONS.includes(contents[c].name)) { continue; }
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
        let idlFile = this._getIDLFile(contents[c]);
        if (idlFile) {
          contents[c].key = idlFile.name;
        } else {
          // console.log('Could not load:');
          // console.log(contents[c]);
        }
        this._files.push(contents[c]);
      }
    }
  }

  get files() {
    const files = this._files[Symbol.iterator]();
    return files;
  }

  _getIDLFile(fileObject) {
    try {
      let idlFile = new InterfaceData(fileObject, {
        experimental: true,
        originTrials: true
      });
      return idlFile;
    } catch (e) {
      switch (e.constructor.name) {
        case 'IDLError':
        case 'WebIDLParseError':
          break;
      }
    }
  }

  findMatching(name) {
    let matches = [];
    let lcName = name.toLowerCase();
    for (let f of this._files) {
      if (!f.key) { continue; }
      let lcKey = f.key.toLowerCase();
      if (lcKey.includes(lcName)) {
        matches.push(f);
      }
    }
    return matches;
  }
}

module.exports.IDLFileSet = IDLFileSet;
