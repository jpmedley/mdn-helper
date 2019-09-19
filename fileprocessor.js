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

const { CallbackData, InterfaceData, TREE_TYPES } = require('./interfacedata.js');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

const METAFILE = Object.freeze({
  path: '',
  key: '',
  keys: null,
  type: ''
});

class FileProcesser {
  constructor(sourceFile, interfaceSet) {
    this._sourceFile = sourceFile;
    this._interfaces = interfaceSet;
    this._sourceTree;
    this._loadTree();
  }

  process(options = {}) {
    for (let t of this._sourceTree) {
      if (t.type === 'eof') { continue; }
      let im = Object.assign({}, METAFILE);
      im.path = this._sourceFile;
      let className = (t.type.split(' '))[0];
      im.type = TREE_TYPES[className];

      options.sourcePath = this._sourceFile;
      let interfaceInstance = new im.type(t, options);
      im.keys = [];
      im.keys.push(...interfaceInstance.keys);
      im.key = im.keys[0];
      this._interfaces.add(im);
    }
  }

  _loadTree() {
    this._sourceContents = utils.getIDLFile(this._sourceFile);
    this._sourceTree = webidl2.parse(this._sourceContents);
  }
}

module.exports.FileProcessor = FileProcesser;
module.exports.METAFILE = METAFILE;