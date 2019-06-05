'use strict';

const fs = require('fs');
const { InterfaceData } = require('./interfacedata.js');

const EXCLUSIONS = ['inspector','testing','typed_arrays'];

class IDLFileSet {
  constructor(rootDirectory = 'idl/', options = {}) {
    this._experimental = (options.experimental? options.experimental: false);
    this._originTrial = (options.originTrial? options.originTrial: false);
    this._files = [];
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
          contents[c].key = idlFile.name;
          this._files.push(contents[c]);
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

  writeKeys(keyFile) {
    if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
    const files = this.files;
    for (let f in files) {
      f.writeKeys(keyFile)
    }
  }

  _getIDLFile(fileObject) {
    try {
      let idlFile = new InterfaceData(fileObject, {
        experimental: this._experimental,
        originTrial: this._originTrial
      });
      return idlFile;
    } catch (e) {
      switch (e.constructor.name) {
        case 'IDLError':
        case 'WebIDLParseError':
        case 'IDLFlagError':
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
