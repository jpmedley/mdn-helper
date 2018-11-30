'use strict';

const fs = require('fs');

const ENTRY_TEMPLATE = Object.freeze({
  key: null,
  lcKey: null,
  path: null
})

class APIIndex {
  constructor(indexFile) {
    this._indexFile = indexFile;
    this._indexEntries = [];
    this._loadIndex();
  }

  _loadIndex() {
    const indexBuffer = fs.readFileSync(this._indexFile);
    const indexFile = indexBuffer.toString();
    const indexEntries = indexFile.split('\n');
    for (let i of indexEntries) {
      let indexEntry = Object.assign({}, ENTRY_TEMPLATE);
      const pieces = i.split(',');
      indexEntry.key = pieces[0];
      indexEntry.lcKey = pieces[0].toLowerCase();
      indexEntry.path = pieces[1];
      this._indexEntries.push(indexEntry);
    }
  }

  findInterfaces(containing) {
    containing = containing.toLowerCase();
    let results = [];
    for (let i of this._indexEntries) {
      if (i.key.includes('.')) { continue; }
      if (i.lcKey.includes(containing)) {



        results.push(i)
      }
    }
    console.log(results);
  }
}

module.exports.APIIndex = APIIndex
