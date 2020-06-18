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

  _findExactProperties(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    this.properties.data.forEach(element => {
      if (element.name === searchValue) {
        foundProperties.push(element);
      }
    });
    return foundProperties;
  }

  _findMatchingProperties(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    this.properties.data.forEach(element => {
      if (element.name.includes(searchValue)) {
        foundProperties.push(element);
      }
    });
    return foundProperties;
  }

  findExact(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    foundProperties.push(...this._findExactProperties(searchValue, includeFlags, includeOriginTrials));
    return foundProperties;
  }

  findMatching(searchValue, includeFlags=false, includeOriginTrials=false) {
    let foundProperties = [];
    foundProperties.push(...this._findMatchingProperties(searchValue, includeFlags, includeOriginTrials));
    return foundProperties;
  }
}

module.exports.CSSSet = CSSSet;