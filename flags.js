'use strict';

const fs = require('fs');
const json5 = require('json5')

let flags;

class _FlagStatus {
  constructor() {
    this._loadFlags();
  }

  _loadFlags() {
    const flagPath = 'idl/platform/runtime_enabled_features.json5';
    const flagFileContents = fs.readFileSync(flagPath).toString();
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

function getFlagObject() {
  if (!flags) {
    flags = new _FlagStatus();
  }
  return flags;
}

module.exports.FlagStatus = getFlagObject();
