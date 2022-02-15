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

// const CALLBACK_RE = /callback\s*(\w*)[^;]*;/g;
const CALLBACK_RE = /(?:\[[^\]]*\])*\s*callback\s*(\w*)[^;]*;/g;
const DICTIONARY_RE = /(\[[^\]]*\])*\s*dictionary\s(\w+)\s*(?::\s*(\w+))?[^\{]*\{[^\}]*\};/gm;
const ENUM_RE = /enum[^\w]+(\w*)[^{]({[^}]*});/gm;
const EXTENDED_ATTRIBS_RE = /(\[[^\]]*\])\s*interface/m;
const INCLUDES_RE = /(\w*)\s+includes\s+(\w*);/gm;
const INTERFACE_SIGNITURE_RE = /(callback|partial)?\s*interface\s*(mixin)?\s*(\w+)\s*(?::\s+(\w+))?[^\{]*\{/m;
const INTERFACE_BODY_RE = /interface[^\{]*\{[^\}]*(?:.(?!\}));/gm;
const NAMESPACE = /(\[[^\]]*\])\s*(partial)?\s*namespace\s*(\w*)[^\{]*\{([^\}])*\};/gm;
const TYPEDEF_SIMPLE = /typedef\s*(\w*\s*)*;/gm;
const TYPEDEF_COMPOUND = /typedef[^\(]*(\([^\)]*\))\s*(\w*);/gm;
const TYPEDEF_LINE = /typedef[^;]*;/g

class _SourceProcessor_Base {
  #EXCLUSIONS = [];
  #sourcePaths = [];
  #sourceRecords = new Map();
  constructor(sourceLocation, options = {}) {
    this._processSource(sourceLocation);
  }

  _processSource(sourceLocation) {
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
      rawData = this._processCallbacks(rawData, p);
      rawData = this._processDictionaries(rawData, p);
      rawData = this._processEnums(rawData, p);
      rawData = this._processIncludes(rawData, p);
      rawData = this._processNamespaces(rawData, p);
      rawData = this._processTypeDefs(rawData, p);
      // Interface should always be last.
      rawData = this._processInterface(rawData, p);
      if (rawData.trim() !== '') {
        const msg = `File ${p} contains an unknown or malformed structure.`;
        console.log(rawData);
        throw new IDLError(msg, p);
      }
    }
    return this.#sourceRecords;
  }

  _processInterface(rawData, path) {
    if (!rawData.includes('interface')) { return rawData; }
    const interfaceSigniture = rawData.match(INTERFACE_SIGNITURE_RE);
    if (!interfaceSigniture) {
      const msg = `File ${path} contains a malformed interface.`;
      throw new IDLError(msg, path);
    }
    if (interfaceSigniture) {
      let type;
      if (interfaceSigniture[1]) { type = interfaceSigniture[1]; }
      if (interfaceSigniture[2]) { type = interfaceSigniture[2]; }
      this._recordRecord(interfaceSigniture[3], rawData, path, type);
      rawData = rawData.replace(rawData, '');
    }
    return rawData.trim();
  }

  _processCallbacks(rawData, path) {
    if (!rawData.includes('callback')) { return rawData; }
    const foundCallbacks = rawData.matchAll(CALLBACK_RE);
    if (!foundCallbacks) {
      const msg = `File ${path} contains a malformed callback.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundCallbacks) {
      if (f[0].includes('callback interface')) { continue; }
      this._recordRecord(f[1], f, path, 'callback');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processDictionaries(rawData, path) {
    if (!rawData?.includes('dictionary')) { return rawData; }
    const foundDictionaries = rawData.matchAll(DICTIONARY_RE);
    if (!foundDictionaries) {
      const msg = `File ${path} contains a malformed dictionary.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundDictionaries) {
      this._recordRecord(f[2], f, path, 'dictionary');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processEnums(rawData, path) {
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

  _processNamespaces(rawData, path) {
    if (!rawData.includes('namespace')) { return rawData; }
    const foundNamespaces = rawData.matchAll(NAMESPACE);
    if (!foundNamespaces) {
      const msg = `File ${path} contains a malformed namespace.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundNamespaces) {
      this._recordRecord(f[3], f, path, 'namespace');
      rawData = rawData.replace(f[0], '');
    }
    return rawData.trim();
  }

  _processTypeDefs(rawData, path) {
    if (!rawData.includes('typedef')) { return rawData; }
    const foundTypedefs = rawData.matchAll(TYPEDEF_LINE);
    if  (!foundTypedefs) {
      const msg = `File ${path} contains a malformed typedef.`;
      throw new IDLError(msg, path);
    }
    for (let f of foundTypedefs) {
      let pieces = f[0].split(' ');
      let name = pieces[pieces.length -1 ];
      if (name.endsWith(';')) {
        name = name.slice(0, -1);
      }
      this._recordRecord(name, f, path, 'typedef');
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