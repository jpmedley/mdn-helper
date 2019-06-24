// Copyright 2019 Google LLC
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
const utils = require('./utils.js');

const API_TEMPLATE = fs.readFileSync('templates/bcd-api.txt');
const CONSTR_TEMPLATE = fs.readFileSync('templates/bcd-constructor.txt');
const MEMBER_TEMPLATE = fs.readFileSync('templates/bcd-member.txt');

function _copyString(oldString) {
  return (' ' + oldString).slice(1);
}

class _BCDManager {
  constructor(type = 'api') {
    // Later this will need to distinguish BCD categories.
    this._bcdString = '';
  }

  _write(outFilePath) {
    let file = utils.getOutputFile(outFilePath);
    fs.write(file, this._bcdString, ()=>{});
    fs.close(file, ()=>{});
  }

  getBCD(interfaceData, outFilePath) {
    let members = [];
    if (interfaceData.hasConstructor) {
      members.push(_copyString(CONSTR_TEMPLATE));
    }
    for (let m of interfaceData.members) {
      let member = _copyString(MEMBER_TEMPLATE)
                   .replace(/\[\[member-name\]\]/g, m[0]);
      members.push(member);
    }
    let memberString = members.join(',\n');
    memberString = memberString.replace('\n,', ',');
    this._bcdString = _copyString(API_TEMPLATE);
    this._bcdString = this._bcdString.replace('[[members]]', members);
    this._bcdString = this._bcdString.replace(/\[\[api-name\]\]/g, interfaceData.name);
    this._write(outFilePath);
    const msg = `BCD boilerplate has been written to ${outFilePath}.`
    console.log(msg);
    return outFilePath;
  }
}

module.exports.BCDManager = _BCDManager;
