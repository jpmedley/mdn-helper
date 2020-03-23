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

const { CallbackData, InterfaceData, TREE_TYPES } = require('./__interfacedata.js');
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

const CALLBACK_RE = /callback([^=]*)([^(]*)\(([^)]*)\)/gm;
const DICTIONARY_RE = /dictionary([^{]*){([^}]*)}/gm;
const ENUM_RE = /enum[\w\s]+{([^}]*)}/gm;
const EXTENDED_ATRIB_RE = /\[\n([^\]]*)\]/gm;
const INTERFACE_RE = /(\[(([^\]]*))\])?\sinterface([^{]*){([^}]*)}/gm;

class FileProcesser {
  constructor(sourcePath) {
    this._sourcePath = sourcePath;
    this._sourceContents;
    this._sourceTree;
    this._validSource;
    // this._loadTree();
    this._loadSource();
  }

  __process(resultCallback, returnSource) {
    let match;
    let interfaceMeta;
    match = this._sourceContents.match(CALLBACK_RE);
    if (match) {
      interfaceMeta = this.__getInterfaceMeta(match[0]);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(DICTIONARY_RE);
    if (match) {
      interfaceMeta = this.__getInterfaceMeta(match[0]);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(ENUM_RE);
    if (match) {
      interfaceMeta = this.__getInterfaceMeta(match[0]);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(EXTENDED_ATRIB_RE);
    if (match) {
      interfaceMeta = this.__getInterfaceMeta(match[0]);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(INTERFACE_RE);
    if (match) {
      // interfaceMeta = this.__getInterfaceMeta(match[0]);
      // resultCallback(interfaceMeta);
      interfaceMeta = new InterfaceData(match[0]);
      resultCallback(interfaceMeta);
    }
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

  __getInterfaceMeta(source) {
    let im = Object.assign({}, METAFILE);
    im.path = this._sourcePath;
    im.keys = [];
    im.key = im.keys[0];
    im.tree = source;
    return im;
  }

  _getInterfaceMeta(interfaceData) {
    let im = Object.assign({}, METAFILE);
    im.path = this._sourcePath;
    im.keys = [];
    im.keys.push(...interfaceData.keys);
    im.key = im.keys[0];
    return im;
  }

  _loadSource() {
    this._sourceContents = utils.getIDLFile(this._sourcePath);
    let sourceTree;
    try {
      // Use webidl2 only for crude validation.
      sourceTree = webidl2.parse(this._sourceContents);
    } catch(e) {
      global.__logger.error(e.message);
      throw e;
    } finally {
      sourceTree = null;
    }
  }

  // _loadTree() {
  //   this._sourceContents = utils.getIDLFile(this._sourcePath);
  //   this._sourceTree = webidl2.parse(this._sourceContents);
  // }
}

module.exports.FileProcessor = FileProcesser;
module.exports.METAFILE = METAFILE;