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

const { BCDBuilder } = require('./bcdbuilder.js');

class JSONError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class _BCDEditor {
  constructor(source) {
    this._tree;
    this._validateSourceMakeTree(source);
  }

  _validateSourceMakeTree(source) {
    switch (source.constructor.name) {
      case "InterfaceData":
        const bcdBuilder = new BCDBuilder(source, 'api', {});
        this._tree = bcdBuilder.getBCDObject();
        break;
      case "Object":
        this._tree = source;
        break;
      case "String":
        this._tree = JSON.parse(source);
        break;
      default:
        console.log(source.constructor.name);
        break;
    }
  }

  get tree() {
    return this._tree;
  }
}

module.exports.BCDEditor = _BCDEditor;