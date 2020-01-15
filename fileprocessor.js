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
  flag: null,
  path: '',
  key: '',
  keys: null,
  originTrial: null,
  tree: null,
  type: ''
});

class FileProcesser {
  constructor(sourcePath) {
    this._sourcePath = sourcePath;
    this._sourceTree;
    this._loadTree();
  }

  process(resultCallback, returnTree=false) {
    let intface = this._sourceTree.find(elem => {
      return elem.type === 'interface';
    });
    let interfaceData = new InterfaceData(intface, { sourcePath: this._sourcePath });
    let flagged = interfaceData.flagged;
    let originTrial = interfaceData.originTrial;
    let className = (interfaceData.type.split(' '))[0];
    let interfaceMeta = this._getInterfaceMeta(interfaceData);
    if (returnTree) { interfaceMeta.tree = intface; }
    interfaceMeta.flag = flagged;
    interfaceMeta.originTrial = originTrial;
    interfaceMeta.type = TREE_TYPES[className];
    resultCallback(interfaceMeta);

    for (let t of this._sourceTree) {
      if (t.type === 'eof') { continue; }
      if (t.type === 'interface') { continue; }
      className = (t.type.split(' '))[0];
      let metaType = TREE_TYPES[className];
      if (!metaType) { continue; }
      interfaceData = new metaType(t, { sourcePath: this._sourcePath });
      interfaceMeta = this._getInterfaceMeta(interfaceData);
      if (returnTree) { interfaceMeta.tree = t; }
      interfaceMeta.flag = flagged;
      interfaceMeta.originTrial = originTrial;
      interfaceMeta.type = metaType;
      resultCallback(interfaceMeta);
    }
  }

  _getInterfaceMeta(interfaceData) {
    let im = Object.assign({}, METAFILE);
    im.path = this._sourcePath;
    im.keys = [];
    im.keys.push(...interfaceData.keys);
    im.key = im.keys[0];
    return im;
  }

  _loadTree() {
    this._sourceContents = utils.getIDLFile(this._sourcePath);
    this._sourceTree = webidl2.parse(this._sourceContents);
  }
}

module.exports.FileProcessor = FileProcesser;
module.exports.METAFILE = METAFILE;