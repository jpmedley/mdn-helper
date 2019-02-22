'use strict';

const fs = require('fs');
const json5 = require('json5')

class _FlagStatus {
  constructor() {
    this._loadFlags();
  }

  _loadFlags() {
    const flagPath = 'idl/platform/runtime_enabled_features.json5';
    const flagFileContents = fs.readFileSync(flagPath).toString();
    this._flags = json5.parse(flagFileContents).data;
    for (let f of this._flags) {
      this[f.name] = f.status;
    }
  }
}

module.exports.FlagStatus = new _FlagStatus();
