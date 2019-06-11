'use strict';

const { execFileSync } = require('child_process');
const { IDLFileSet } = require('./idlfileset.js');
const utils = require('./utils.js');

const TMP = 'tmp/';

function _command(file, args) {
  let buffer = execFileSync(file, args, {
    cwd: __dirname
  });
  // return buffer.toString();
  return buffer;
}

function _getHashURL(hash) {
  return `https://chromium.googlesource.com/chromium/src/+archive/${hash}/third_party/blink/renderer.tar.gz`;
}

class _Comparator {
  constructor(laterHash, earlierHash) {
    this._currentDirectory = `${TMP}current/`;
    this._previousDirectory = `${TMP}previous/`;
    this._downloadData(laterHash, earlierHash);
    this._writeKeyFiles();
  }

  _compare(base, delta) {
    return base.map((item, index, items) => {
      if (!delta.includes(item)) {
        return item;
      }
    })
  }

  _downloadData(laterHash, earlierHash) {
    utils.deleteUnemptyFolder(TMP);

    utils.makeFolder(this._currentDirectory);
    const currentURL = _getHashURL(laterHash);
    let args = [currentURL, this._currentDirectory, 'noBCD'];
    _command('./update-idl.sh', args);

    utils.makeFolder(this._previousDirectory);
    const previousURL = _getHashURL(earlierHash);
    args = [previousURL, this._previousDirectory];
    _command('./update-idl.sh', args);
  }

  _writeKeyFiles() {
    const currentFileSet = new IDLFileSet(this._currentDirectory);
    currentFileSet.writeKeys(`${TMP}current.txt`);

    const previousFileSet = new IDLFileSet(this._previousDirectory);
    previousFileSet.writeKeys(`${TMP}previous.txt`);
  }

  cleanup() {
    utils.deleteUnemptyFolder(TMP);
  }

  getAdditions() {
    return new Promise((resolve, reject) => {
      
    });
  }

  getRemovals() {
    return new Promise((resolve, reject) => {

    });
  }  
}

module.exports.Comparator = _Comparator;