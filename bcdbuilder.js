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
const NEST_LEVEL = 2;

function _copyString(oldString) {
  return (' ' + oldString).slice(1);
}

class _BCDBuilder {
  constructor(interfaceData, type = 'api', options = { verbose: true }) {
    // Later this will need to distinguish BCD categories.
    this._bcdString = '';
    this._verbose = options.verbose;
    this._interfaceData = interfaceData;
    this._loadBCD();
  }

  write(outFilePath) {    
    // Poor man's way of fixing the nesting.
    const temp = JSON.parse(this._bcdString);
    this._bcdString = JSON.stringify(temp, null, NEST_LEVEL);
    let file = utils.getOutputFile(outFilePath);
    fs.write(file, this._bcdString, ()=>{});
    fs.close(file, ()=>{});
    if (this._verbose) {
      const msg = `BCD boilerplate has been written to ${outFilePath}.`
      console.log(msg);
    }
  }

  getBCD() {
    const msg = 'BCDBuilder.getBCD() is deprecated. Use getBCDObject() instead.'
    return this.getBCDObject();
  }

  getBCDObject() {
    return JSON.parse(this.getRawBCD());
  }

  getRawBCD() {
    return this._bcdString;
  }

  _loadBCD() {
    let members = [];
    if (this._interfaceData.hasConstructor) {
      members.push(_copyString(CONSTR_TEMPLATE));
    }
    for (let m of this._interfaceData.members) {
      let member = _copyString(MEMBER_TEMPLATE)
                   .replace(/\[\[member-name\]\]/g, m[0]);
      members.push(member);
    }
    let memberString = members.join(',\n');
    memberString = memberString.replace('\n,', ',');
    this._bcdString = _copyString(API_TEMPLATE);
    this._bcdString = this._bcdString.replace('[[members]]', members);
    this._bcdString = this._bcdString.replace(/\[\[api-name\]\]/g, this._interfaceData.name);
    return this._bcdString;
  }

}

module.exports.BCDBuilder = _BCDBuilder;
