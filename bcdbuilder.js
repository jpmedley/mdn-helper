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

const API_TEMPLATE = 'templates/bcd-api.txt';
const CONSTR_TEMPLATE = 'templates/bcd-constructor.txt';
const MEMBER_TEMPLATE = 'templates/bcd-member.txt';
const NEST_LEVEL = 2;

function getTemplate(templateName) {
  let source = fs.readFileSync(templateName);
  source = (' ' + source).slice(1);
  return source
}

class _BCDBuilder {
  constructor(interfaceData, type = 'api', options) {
    // Later this will need to distinguish BCD categories.
    this._bcdString = '';
    this._interfaceData = interfaceData;
    this._loadBCD();
  }

  async write(outFilePath) {
    if (fs.existsSync(outFilePath)) { return; }
    utils.confirmPath(outFilePath);
    // Poor man's way of fixing the nesting.
    const temp = JSON.parse(this._bcdString);
    this._bcdString = JSON.stringify(temp, null, NEST_LEVEL);
    fs.writeFileSync(outFilePath, this._bcdString);
    const msg = `BCD boilerplate has been written to ${outFilePath}.`;
    utils.sendUserOutput(msg);
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
    let membersBCD = [];
    const members = this._interfaceData.getMembers( { includeUnnamed: false });
    const skipMembers = ["(getter)", "(iterable)", "(setter)"];
    let constructorFound = false;
    for (let m of members) {
      if (skipMembers.includes(m.name)) { continue; }
      if (m.type === 'Constructor') {
        if (!constructorFound) {
          membersBCD.push(getTemplate(CONSTR_TEMPLATE));
          constructorFound = true;
        }
      } else {
        let member = getTemplate(MEMBER_TEMPLATE)
                     .replace(/\[\[member-name\]\]/g, m.name);
        membersBCD.push(member);
      }
    }
    this._bcdString = getTemplate(API_TEMPLATE);
    let memberString = '';
    if (membersBCD.length) {
      memberString = membersBCD.join(',\n');
      memberString = memberString.replace('\n,', ',');
      memberString = `,${memberString}`;
    }
    this._bcdString = this._bcdString.replace('[[members]]', memberString);
    this._bcdString = this._bcdString.replace(/\[\[api-name\]\]/g, this._interfaceData.name);
    return this._bcdString;
  }
}

module.exports.BCDBuilder = _BCDBuilder;
