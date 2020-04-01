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

const path = require('path');

const utils = require('./utils.js');

const { CallbackData, DictionaryData, EnumData, InterfaceData } = require('./__interfacedata.js');

const METAFILE = Object.freeze({
  flag: null,
  path: '',
  key: '',
  keys: null,
  originTrial: null,
  tree: null,
  type: ''
});

const CALLBACK_RE = /^callback([^=]*)([^(]*)\(([^)]*)\)/gm;
const DICTIONARY_RE = /dictionary([^{]*){([^}]*)}/gm;
const ENUM_RE = /enum[\w\s]+{([^}]*)}/gm;
const INTERFACE_RE = /(\[(([^\]]*))\])?\s?interface([^{]*){([^}]*)}/gm;

class RegExError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class FileProcesser {
  constructor(sourcePath) {
    this._sourcePath = sourcePath;
    this._sourceContents = utils.getIDLFile(this._sourcePath, { clean: true });
  }

  process(resultCallback, returnSource) {
    let match;
    let interfaceMeta;
    match = this._sourceContents.match(CALLBACK_RE);
    const options = { "sourcePath": this._sourcePath };
    if (match) {
      interfaceMeta = new CallbackData(match[0], options);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(DICTIONARY_RE);
    if (match) {
      interfaceMeta = new DictionaryData(match[0], options);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(ENUM_RE);
    if (match) {
      interfaceMeta = new EnumData(match[0], options);
      resultCallback(interfaceMeta);
    }
    match = this._sourceContents.match(INTERFACE_RE);
    if (match) {
      interfaceMeta = new InterfaceData(match[0], options);
      resultCallback(interfaceMeta);
    }
    if (!match) {
      const msg = `No matches found in ${this._sourcePath}.`;
      const scriptFile = path.basename(__filename);
      throw new RegExError(msg, scriptFile);
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

}

module.exports.FileProcessor = FileProcesser;
module.exports.METAFILE = METAFILE;