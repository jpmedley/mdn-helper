// Copyright 2020 Google LLC
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


const { bcd } = new require('./bcd.js');
const { Pinger } = require("./pinger.js");
const utils = require('./utils.js');

class CSSData {
  constructor() {
    this.atRules = utils.getJSON('./idl/core/css/parser/at_rule_names.json5');
    this.properties = utils.getJSON('./idl/core/css/css_properties.json5');
  }
}

module.exports.CSSData = CSSData;