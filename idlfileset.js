'use strict';

const fs = require('fs');
const { InterfaceData } = require('./interfacedata.js');

const EXCLUSIONS = ['inspector','testing','typed_arrays'];

class IDLFileSet {
  constructor(rootDirectory = 'idl/', options = {}) {
    this._includeExperimental = (options.experimental? options.experimental: false);
    this._includeOriginTrial = (options.originTrial? options.originTrial: false);
    this._files = [];
    this._keys = [];
    this._processDirectory(rootDirectory);
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
          if (idlFile.flagged) {
            if (!this._includeExperimental) { continue; }
          }
          contents[c].key = idlFile.name;
          this._files.push(contents[c]);
          this._keys.concat(idlFile.getkeys(true));
        } else {
          // console.log('Could not load:');
          // console.log(contents[c]);
        }
      }
    }
  }

  get files() {
    return this._files;
  }

  _getIDLFile(fileObject) {
    try {
      let idlFile = new InterfaceData(fileObject, {
        experimental: this._includeExperimental,
        originTrial: this._includeOriginTrial
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
