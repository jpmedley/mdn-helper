// Copyright 2022 Google LLC
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

const fs = require('fs');
const path = require('path');

const { IDLError } = require('./errors.js');
const { SourceRecord } = require('./rawsources.js');
const utils = require('./utils.js');

const { initiateLogger } = require('./log.js');
const { raw } = require('config/raw');

initiateLogger(global.__commandName);

const CALLBACK_RE = /callback\s+(\w*)\s+=\s+(\w*)\s+(\([^)]*\));/g;
const DICTIONARY_RE = /dictionary\s(\w+)[^{]({[^}]*\});/gm;
const ENUM_RE = /enum[^\w]+(\w*)[^{]({[^}]*});/gm;
const EXTENDED_ATTRIBS_RE = /(\[[^\]]*\])\s*interface/m;
const INCLUDES_RE = /(\w*)\s+includes\s+(\w*);/gm;
const INTERFACE_SIGNITURE_RE = /(callback|partial)?\s*interface\s+(mixin)?\s*(\w+)\s+(?::\s+(\w+))?/m;
const INTERFACE_BODY_RE = /interface[^\{]*\{[^\}]*(?:.(?!\}));/gm;

class _SourceProcessor_Base {
  #EXCLUSIONS = [];
  #sourcePaths = [];
  #sourceRecords = new Map();
  constructor(sourceLocation, options = {}) {
    this._processSource(sourceLocation);
  }

  _processSource(sourceLocation) {
    // fs.lstatSync(path_string).isDirectory() 
    if (fs.lstatSync(sourceLocation).isDirectory()) {
      this._getSourceList(sourceLocation);
    } else {
      this.#sourcePaths.push(sourceLocation);
    }
  }

  _getSourceList(root) {
    const contents = fs.readdirSync(root, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (this.#EXCLUSIONS.includes(contents[c].name)) { continue; }
        this._getSourceList(`${root}${contents[c].name}/`);
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        this.#sourcePaths.push(`${root}${contents[c].name}`);
      }
    }
  }

  getFeatureSources() {
    for (let p of this.#sourcePaths) {
      let rawData = utils.getIDLFile(p, {clean: true});
      if (!rawData) {
        global.__logger.info(`Cannot process ${root}${contents[c].name}.`);
      }
      // Extract what's not an interface. Interface will be left
      rawData = this._processCallback(rawData, p);
      rawData = this._processDictionary(rawData, p);
      rawData = this._processEnum(rawData, p);
      rawData = this._processIncludes(rawData, p);
      rawData = this._processInterface(rawData, p);
      if (rawData.trim() !== '') {
        const msg = `File ${path} contains an unknown or malformed structure.`;
        throw new IDLError(msg, path);
      }
    }
    return this.#sourceRecords;
  }

  _processInterface(rawData, path) {
    if (!rawData.includes('interface')) { return rawData; }
    const interfaceSigniture = rawData.match(INTERFACE_SIGNITURE_RE);
    if (interfaceSigniture) {
      let type;
      if (interfaceSigniture[1]) { type = interfaceSigniture[1]; }
      if (interfaceSigniture[2]) { type = interfaceSigniture[2]; }
      this._recordRecord(interfaceSigniture[3], rawData, path, type);
      rawData = rawData.replace(rawData, '');
    }
    return rawData.trim();
  }

  _processCallback(rawData, path) {
    if (!rawData.includes('callback')) { return rawData; }
    const foundCallbacks = rawData.matchAll(CALLBACK_RE);
    if (!foundCallbacks) {
      if (rawData?.includes('callback interface')) { return; }
      const msg = `File ${path} contains a malformed callback.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundCallbacks) {
      this._recordRecord(f[1], f, path, 'callback');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processDictionary(rawData, path) {
    if (!rawData?.includes('dictionary')) { return rawData; }
    const foundDictionaries = rawData.matchAll(DICTIONARY_RE);
    if (!foundDictionaries) {
      const msg = `File ${path} contains a malformed dictionary.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundDictionaries) {
      this._recordRecord(f[1], f, path, 'dictionary');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processEnum(rawData, path) {
    if (!rawData?.includes('enum')) { return rawData; }
    const foundEnums = rawData.matchAll(ENUM_RE);
    if (!foundEnums) {
      const msg = `File ${path} contains a malformed enum.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundEnums) {
      this._recordRecord(f[1], f, path, 'enum');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processIncludes(rawData, path) {
    if (!rawData.includes('includes')) { return rawData; }
    const foundIncludes = rawData.matchAll(INCLUDES_RE);
    if (!foundIncludes) {
      const msg = `File ${path} contains a malformed include.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundIncludes) {
      this._recordRecord(f[1], f, path, 'includes');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _recordRecord(name, data, path, type) {
    let sourceRecord = this.#sourceRecords.get(name);
    if (sourceRecord) {
      sourceRecord.push(data, path);
    } else {
      sourceRecord = new SourceRecord(data[0], { path: path, name: name, type: type});
      this.#sourceRecords.set(name, sourceRecord);
    }
  }
}

class IDLSource extends _SourceProcessor_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }
}

class ChromeIDLSource extends IDLSource {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);

  }
  #EXCLUSIONS = ['inspector','testing','typed_arrays'];
}

class CSSSource extends _SourceProcessor_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }
}

module.exports.ChromeIDLSource = ChromeIDLSource;
module.exports.CSSSource = CSSSource;
module.exports.IDLError = IDLError;