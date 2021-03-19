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
const ENUM_CANDIDATE_RE = /\b\s*enum/;
const INCLUDES_RE = /^\s?(\w*)\s*includes\s*(\w*)\s*;/gm;
const INTERFACE_RE = /(\[.*\])?.*(interface)[^\{]*\{.*(?<=});/s;
const INTERFACE_CANDIDATE_RE = /(callback|partial)?\s*interface\s*(mixin)?[^\{]*/;
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
const INTERFACE_OBJECTS = Object.freeze({
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
    const processOptions = { "sourcePath": this._sourcePath };
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
      interfaceMeta = new INTERFACE_OBJECTS['interface'](foundInterface[0], options);
    } else if (interfaceHeader[1] === 'partial') {
      interfaceMeta = new INTERFACE_OBJECTS['partial'](foundInterface[0], options);
    } else if (interfaceHeader[2] === 'mixin') {
      interfaceMeta = new INTERFACE_OBJECTS['mixin'](foundInterface[0], options);
    } else {
      interfaceMeta = new INTERFACE_OBJECTS['interface'](foundInterface[0], options)
;     }
    resultCallback(interfaceMeta);
  }

  _processCallback(resultCallback, options) {
    let callbackCandidate = this._sourceContents.match(CALLBACK_CANDIDATE_RE);
    if (!callbackCandidate) { return; }

    // if (this._sourceContents.includes('callback')) {
      let foundCallback = this._sourceContents.match(CALLBACK_RE);
      if (!foundCallback) {
        // Change this to a regex to account for multiple spaces 
        if (this._sourceContents.includes('callback interface')) { return; }
        const msg = `File ${this._sourcePath} contains a malformed callback.`;
        throw new IDLError(msg, this._sourcePath);
      }
      const interfaceMeta = new INTERFACE_OBJECTS['callback'](foundCallback[0], options);
      resultCallback(interfaceMeta);
    // }
  }

  _processDictionary(resultCallback, options) {
    if (this._sourceContents.includes('dictionary')) {
      let foundDictionary = this._sourceContents.match(DICTIONARY_RE);
      if (!foundDictionary) {
        const msg = `File ${this._sourcePath} contains a malformed dictionary.`;
        throw new IDLError(msg, this._sourcePath);
      }
      const interfaceMeta = new INTERFACE_OBJECTS['dictionary'](foundDictionary[0], options);
      resultCallback(interfaceMeta);
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
    const interfaceMeta = new INTERFACE_OBJECTS['enum'](foundEnum[0], options);
    resultCallback(interfaceMeta);
  }

  _processIncludes(resultCallback, options) {
    if (this._sourceContents.includes('includes')) {
      let foundIncludes = this._sourceContents.matchAll(INCLUDES_RE);
      if (!foundIncludes) {
        const msg = `File ${this._sourcePath} contains a malformed includes statement.`;
        throw new IDLError(msg, this._sourcePath);
      }
      for ( const fi of foundIncludes) {
        const interfaceMeta = new INTERFACE_OBJECTS['includes'](fi[0], options);
        resultCallback(interfaceMeta);
      }
      return foundIncludes;
    }
  }

  process_(resultCallback) {
    let interfaceMeta;
    let recording = false;
    let lines = this._sourceContents.split('\n');
    let hold = [];
    let type;
    const options = { "sourcePath": this._sourcePath };
    for (let l of lines) {
      type = ((l, currentType) => {
        let start = STARTS.find(f => {
          return l.startsWith(f);
        });
        if (start) {
          if (l.trim().includes("[")) { return "interface"; }
          if (l.trim().includes("callback interface")) { return "interface"; }
          return start;
        } else {
          return currentType;
        }
      })(l, type);
      if (!recording) {
          switch (type) {
            case "callback":
              interfaceMeta = new INTERFACE_OBJECTS[type](l, options);
              resultCallback(interfaceMeta);
              continue;
            case "dictionary":
            case "enum":
            case "typedef":
              continue;
            default:
              break;
          }
          recording = true;
          hold.push(l);
        // }
      } else {
        hold.push(l);
        if (l.trim().startsWith("};")) {
          recording = false;
          let objectSource = hold.join('\n');
          interfaceMeta = new INTERFACE_OBJECTS[type](objectSource, options);
          resultCallback(interfaceMeta);
          hold = [];
        }
      }
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
module.exports.IDLError = IDLError;
module.exports.METAFILE = METAFILE;