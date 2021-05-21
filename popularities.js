// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const fs = require('fs');
const { downloadPopularities } = require('./updateData.js');
const { getFile } = require('./utils.js');

class popularities {
  constructor(category) {
    this._popularities = this._loadPopularities(category);
  }

  _loadPopularities(filter) {
    if (!fs.existsSync('popularities.json')) {
      downloadPopularities();
    }
    const source = getFile('popularities.json');
    let someData = source.split(',');
    someData.shift();
    someData.pop();
    if (!filter) { return someData; }
    return someData.filter(f => {
      return f.includes(filter);
    });
  }

  get rawData() {
    return this._popularities;
  }

  getRating(key) {
    let val = this._popularities.find(f => {
      return f.includes(key);
    });
    val = val.split(":")[1];
    val = val.trim();
    return new Number(val);
  }
}

module.exports.Popularities = popularities;