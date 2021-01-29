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

const { CallbackData, DictionaryData, EnumData, InterfaceData } = require('./interfacedata.js');

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
  "interface": InterfaceData,
  "partial": InterfaceData
});

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

  process(resultCallback) {
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

      // type = STARTS.find(f => {
      //   return l.startsWith(f);
      // });
      if (!recording) {
        // if (type) {
          // if (l.includes("callback interface")) {
          //   type = "interface";
          // }
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
module.exports.METAFILE = METAFILE;