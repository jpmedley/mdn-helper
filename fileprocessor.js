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

const utils = require('./utils.js');

const { IDLError } = require('./errors.js');
const { 
  CallbackData, 
  DictionaryData, 
  EnumData, 
  IncludesData, 
  InterfaceData 
} = require('./interfacedata.js');

const CALLBACK_RE = /callback\s*(\w*)\s*=[^;]*;/;
const CALLBACK_CANDIDATE_RE = /callback[\w\s]*=/;
const DICTIONARY_RE = /\s*dictionary\s*(\w*)[^{]*\{[^}]*\};/m;
const ENUM_RE = /\b\s*enum\s*(\w*)[^{]*\{[^}]*\};/gm;
const ENUM_CANDIDATE_RE = /\b\s*enum\b/;
const INCLUDES_RE = /^\s?(\w*)\s*includes\s*(\w*)\s*;/gm;
const INTERFACE_RE = /(\[.*\])?.*(interface)[^\{]*\{.*(?<=});/s;
const INTERFACE_CANDIDATE_RE = /(callback|partial)?\s*(?<!")interface\s*(mixin)?[^\{]*/m;
const INTERFACE_HEADER_RE = INTERFACE_CANDIDATE_RE;

const METAFILE = Object.freeze({
  flag: null,
  path: '',
  key: '',
  keys: null,
  originTrial: null,
  tree: null,
  type: ''
});

const STARTS = ["[", "callback", "dictionary", "enum", "interface", "partial", "typedef"];
const IDL_OBJECTS = Object.freeze({
  "[": InterfaceData,
  "callback": CallbackData,
  "dictionary": DictionaryData,
  "enum": EnumData,
  "includes": IncludesData,
  "interface": InterfaceData,
  "mixin": InterfaceData,
  "partial": InterfaceData
});

class FileProcesser {
  constructor(sourcePath) {
    this._sourcePath = sourcePath;
    this._sourceContents = utils.getIDLFile(this._sourcePath, { clean: true });
  }

  // Gets new options argument with interfaces only default
  process(resultCallback) {
    const processOptions = { 
      "sourcePath": this._sourcePath,
      "flag": false
     };
    this._processInterface(resultCallback, processOptions);
    this._processCallback(resultCallback, processOptions);
    this._processDictionary(resultCallback, processOptions);
    this._processEnum(resultCallback, processOptions);
    this._processIncludes(resultCallback, processOptions);
  }

  _processInterface(resultCallback, options) {
    let interfaceCandidate = this._sourceContents.match(INTERFACE_CANDIDATE_RE);
    if (!interfaceCandidate) { return; }
    let foundInterface = this._sourceContents.match(INTERFACE_RE);
    if (!foundInterface) {
      const msg = `File ${this._sourcePath} contains malformed interface.`;
      throw new IDLError(msg, this._sourcePath);
    }
    let interfaceHeader = this._sourceContents.match(INTERFACE_HEADER_RE);
    let interfaceMeta;
    if (interfaceHeader[1] === 'callback') {
      // Callback inerfaces (as opposed to callback functions) are treated the
      // same as standard interfaces.
      interfaceMeta = new IDL_OBJECTS['interface'](foundInterface[0], options);
    } else if (interfaceHeader[1] === 'partial') {
      interfaceMeta = new IDL_OBJECTS['partial'](foundInterface[0], options);
    } else if (interfaceHeader[2] === 'mixin') {
      interfaceMeta = new IDL_OBJECTS['mixin'](foundInterface[0], options);
    } else {
      interfaceMeta = new IDL_OBJECTS['interface'](foundInterface[0], options);
    }
    options.flag = interfaceMeta.flag;
    resultCallback(interfaceMeta);
  }

  _processCallback(resultCallback, options) {
    let callbackCandidate = this._sourceContents.match(CALLBACK_CANDIDATE_RE);
    if (!callbackCandidate) { return; }
    let foundCallback = this._sourceContents.match(CALLBACK_RE);
    if (!foundCallback) {
      if (this._sourceContents.includes('callback interface')) { return; }
      const msg = `File ${this._sourcePath} contains a malformed callback.`;
      throw new IDLError(msg, this._sourcePath);
    }
    const callbackMeta = new IDL_OBJECTS['callback'](foundCallback[0], options);
    callbackMeta.flag = options.flag;
    resultCallback(callbackMeta);
  }

  _processDictionary(resultCallback, options) {
    if (this._sourceContents.includes('dictionary')) {
      let foundDictionary = this._sourceContents.match(DICTIONARY_RE);
      if (!foundDictionary) {
        const msg = `File ${this._sourcePath} contains a malformed dictionary.`;
        throw new IDLError(msg, this._sourcePath);
      }
      const dictionaryMeta = new IDL_OBJECTS['dictionary'](foundDictionary[0], options);
      dictionaryMeta.flag = options.flag;
      resultCallback(dictionaryMeta);
    }
  }

  _processEnum(resultCallback, options) {
    let enumCandidate = this._sourceContents.match(ENUM_CANDIDATE_RE);
    if (!enumCandidate) { return; }
    let foundEnum = this._sourceContents.match(ENUM_RE);
    if (!foundEnum) {
      const msg = `File ${this._sourcePath} contains a malformed enum.`;
      throw new IDLError(msg, this._sourcePath);
    }
    const enumMeta = new IDL_OBJECTS['enum'](foundEnum[0], options);
    enumMeta.flag = options.flag;
    resultCallback(enumMeta);
  }

  _processIncludes(resultCallback, options) {
    if (this._sourceContents.includes('includes')) {
      let foundIncludes = this._sourceContents.matchAll(INCLUDES_RE);
      if (!foundIncludes) {
        const msg = `File ${this._sourcePath} contains a malformed includes statement.`;
        throw new IDLError(msg, this._sourcePath);
      }
      for ( const fi of foundIncludes) {
        const includesMeta = new IDL_OBJECTS['includes'](fi[0], options);
        includesMeta.flag = options.flag;
        resultCallback(includesMeta);
      }
      return foundIncludes;
    }
  }
}

module.exports.FileProcessor = FileProcesser;
module.exports.IDLError = IDLError;
module.exports.METAFILE = METAFILE;