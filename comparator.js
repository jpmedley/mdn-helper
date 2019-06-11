'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const utils = require('./utils.js');

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
    this._downloadData(laterHash, earlierHash);
  }

  _downloadData(laterHash, earlierHash) {
    utils.deleteUnemptyFolder('./tmp/');

    const currentDirectory = './tmp/current/';
    utils.makeFolder(currentDirectory);
    const currentURL = _getHashURL(laterHash);
    let args = [currentURL, currentDirectory, 'noBCD'];
    _command('./update-idl.sh', args);

    const previousDirectory = './tmp/previous/';
    utils.deleteUnemptyFolder(previousDirectory);
    utils.makeFolder(previousDirectory);
    const previousURL = _getHashURL(earlierHash);
    args = [previousURL, previousDirectory];
    _command('./update-idl.sh', args);
  }

  
}

module.exports.Comparator = _Comparator;