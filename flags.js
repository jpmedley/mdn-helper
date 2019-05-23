'use strict';

const fs = require('fs');
const json5 = require('json5')

let flags;

class _FlagStatus {
  constructor(flagPath) {
    this._flagPath = flagPath;
    this._loadFlags();
  }

  _loadFlags() {
    const flagFileContents = fs.readFileSync(this._flagPath).toString();
    const flagArray = json5.parse(flagFileContents).data;
    for (let f of flagArray) {
      this[f.name] = f.status;
    }
  }

  getBooleanStatus(key) {
    const flagData = this[key];
    switch (typeof flagData) {
      case 'string':
        if (flagData === 'stable') { return true; }
        return false;
        break;
      default:
        for (let g in flagData) {
          if (flagData[g] === 'stable') { return true; }
        }
        return false;
    }
  }
}

function getFlagObject(flagPath) {
  if (!flags) {
    flags = new _FlagStatus(flagPath);
  }
  return flags;
}

module.exports.FlagStatus = getFlagObject;
