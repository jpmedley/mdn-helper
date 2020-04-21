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

class CSSSet {
  constructor() {
    this.properties = utils.getJSON('./idl/core/css/css_properties.json5');
    this.propertyMethods = utils.getJSON('./idl/core/css/properties/css_property_methods.json5');
    this.media = {};
    this.media.names = utils.getJSON('./idl/core/css/media_feature_names.json5');
    this.media.types = utils.getJSON('./idl/core/css/media_type_names.json5');
    this.values = utils.getJSON('./idl/core/css/css_primitive_value_units.json5');
    this.values.keywords = utils.getJSON('./idl/core/css/css_value_keywords.json5');
    this.svg = utils.getJSON('./idl/core/css/svg_css_value_keywords.json5');
  }

  findExact(searchValue, includeFlags=false, includeOriginTrials=false) {

  }

  findMatching(searchValue, includeFlags=false, includeOriginTrials=false) {

  }
}

module.exports.CSSSet = CSSSet;