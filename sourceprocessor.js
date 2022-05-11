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
const { CallbackSourceRecord, SourceRecord } = require('./rawsources.js');
const utils = require('./utils.js');

const { initiateLogger } = require('./log.js');
const { raw } = require('config/raw');

initiateLogger(global.__commandName);

const CALLBACK_NAME = /callback\s*(\w*)[^=]*/;
const CALLBACK_INTERFACE_NAME = /callback\s*interface\s*(\w*)\s*\{/;
const DICTIONARY_NAME = /dictionary\s*(\w*)[^\{]*\{/;
const ENUM_NAME = /enum\s*(\w*)\s*\{/;
const INCLUDES_NAME = /(\w*)\sincludes\s[^;]*;/;
const INTERFACE_NAME = /\]?\s*interface\s*(\w*)[^:]*/;
const MIXIN_NAME = /\]?\s*interface\s*mixin\s*(\w*)\s*\{/;
const NAMESPACE_NAME = /\]?\s*namespace\s*(\w*)[^\{]*\{/;
const PARTIAL_NAME = /\]?\s*partial\s*interface\s*(\w*)/;
const TYPEDEF_EXT_ATTRIBS = /typedef\s[^\]]*\]\s*[^\s]*\s*(\w*);/;
const TYPEDEF_NAME_SIMPLE = /typedef\s*(?:[^\s]*\s+){1,2}(\w*);/;
const TYPEDEF_NAME_COMPOUND = /typedef\s*\([^\)]*\)\s*(\w*);/;
const TYPEDEF_COMPOUND_COMPLEX = /typedef\s\((?:[^\)]*\))*\s(\w*);/;
const TYPEDEF_NAME_COMPOUND_RETURN = /typedef\s*[^>>]*>>\s*(\w*);/;
const TYPEDEF_NAME_COMPLEX = /typedef\s*(?:\w*\s*){3}(\w*);/;
const TYPEDEF_SEQUENCE = /typedef\ssequence[^>]*>\s(\w*);/;

const EXCLUSIONS = ['inspector','testing','typed_arrays'];
const KEYWORDS = ['callback', 'dictionary', 'enum', 'includes', 'interface', 'mixin', 'namespace', 'typedef'];

class _SourceProcessor_Base {
  constructor(sourceLocation, options = {}) {
    this._sourcePaths = new Array();
    this._sourceRecords = new Map();
    this._processSource(sourceLocation);
  }

  _processSource(sourceLocation) {
    // TO DO: Relace with const glob = require('glob');
    if (fs.lstatSync(sourceLocation).isDirectory()) {
      this._getSourceList(sourceLocation);
    } else {
      this._sourcePaths.push(sourceLocation);
    }
  }

  _getSourceList(root) {
    const contents = fs.readdirSync(`${root}`, {withFileTypes: true});
    for (let c in contents) {
      if (contents[c].isDirectory()) {
        if (EXCLUSIONS.includes(contents[c].name)) { continue; }
        this._getSourceList(`${root}${contents[c].name}/`);
      } else if (contents[c].isFile()) {
        if (!contents[c].name.endsWith('.idl')) { continue; }
        if (contents[c].name.startsWith('test_')) { continue; }
        this._sourcePaths.push(`${root}${contents[c].name}`);
      }
    }
  }

  getFeatureSources() {
    for (let p of this._sourcePaths) {
      let rawData = utils.getIDLFile(p, {clean: true});
      if (!rawData) {
        const msg = `Cannot process ${p}.`;
        global.__logger.info(`Cannot process ${p}.`);
        throw new IDLError(msg);
      }
      const lines = rawData.split('\n');
      let currentStructure = '';
      let name = '';
      let type = '';
      for (const l of lines) {
        let firstLineOfStruct = (() => {
          if (l.trim().startsWith('[') && (!l.trim().endsWith(';'))) {
            return true;
          }
          let found = KEYWORDS.some((e) => {
            // Spaces are needed to prvent false positives.
            // (Enums may contain these keywords in quotes.)
            return l.includes(`${e} `);
          });
          return found;
        })();

        if (firstLineOfStruct) {
          if (name) {
            this._recordRecord(name, type, currentStructure, p);
          }
          currentStructure = '';
          type = '';
          name = '';
        }
        if (!type && firstLineOfStruct) {
          type = (() => {
            if (l.includes('callback interface')) { return 'callback-interface'; }
            if (l.includes('callback')) { return 'callback'; }
            if (l.includes('interface mixin')) { return 'mixin'; }
            if (l.includes('partial interface')) { return 'partial'; }
            return KEYWORDS.find((e) => {
             var rx = new RegExp(`\\b${e} `);
             let index = l.search(rx);
             if (index >= 0) { return true } else { return false; }
            });
          })();
          if (type) {
            try {
              name = this._getName(l, type);
            } catch (error) {
              if (error instanceof IDLError) {
                const msg = `Could not extract name for ${type} from ${p} in line:\n\n${l}`;
                error.message = msg;
                throw error;
              }
              // Punting because of multiline typedef
              if (!type==='typedef') {
                throw error;
              }
            }
          }
        }
        currentStructure += `${l}\n`;
      }
      if (name) {
        this._recordRecord(name, type, currentStructure, p);
      }
    }
    return this._sourceRecords;
  }

   _getName(fromLine, ofType) {
    let matches;
    switch (ofType) {
      case 'callback':
        matches = fromLine.match(CALLBACK_NAME);
        break;
      case 'callback-interface':
        matches = fromLine.match(CALLBACK_INTERFACE_NAME);
        break;
      case 'dictionary':
        matches = fromLine.match(DICTIONARY_NAME);
        break;
      case 'enum':
        matches = fromLine.match(ENUM_NAME);
        break;
      case 'includes':
        matches = fromLine.match(INCLUDES_NAME);
        break;
      case 'interface':
        matches = fromLine.match(INTERFACE_NAME);
        break;
      case 'mixin':
        matches = fromLine.match(MIXIN_NAME);
        break;
      case 'namespace':
        matches = fromLine.match(NAMESPACE_NAME);
        break;
      case 'partial':
        matches = fromLine.match(PARTIAL_NAME);
        break;
      case 'typedef':
        matches = fromLine.match(TYPEDEF_NAME_SIMPLE);
        if (!matches) {
          matches = fromLine.match(TYPEDEF_NAME_COMPOUND);
        }
        if (!matches) {
          matches = fromLine.match(TYPEDEF_NAME_COMPLEX);
        }
        if (!matches) {
          matches = fromLine.match(TYPEDEF_EXT_ATTRIBS);
        }
        if (!matches) {
          matches = fromLine.match(TYPEDEF_COMPOUND_COMPLEX);
        }
        if (!matches) {
          matches = fromLine.match(TYPEDEF_NAME_COMPOUND_RETURN);
        }
        if (!matches) {
          matches = fromLine.match(TYPEDEF_SEQUENCE);
        }
        break;
      default:
        throw new IDLError();
    }
    let name;
    if (matches) {
      name = matches[1].trim();
    } else {
      throw new IDLError();
    }
    return name;
  }

  _getKey(name, type) {
    if ('includes, mixin'.includes(type)) {
      return `${name}-interface`;
    } else {
      return `${name}-${type}`;
    }
  }

  _recordRecord(name, type, data, path) {
    let key
    if (type === 'includes') {
      const matches = data.match(/\w*\s*includes\s*(\w*)/);
      const sourceInterface = matches[1];
      const sourceKey = this._getKey(sourceInterface, 'interface');
      const sourceData = this._sourceRecords.get(sourceKey);
      if (sourceData) {
        data = sourceData.sources[0].sourceIdl;
        path = sourceData.sources[0].path;
      }
    }
    key = this._getKey(name, type);
    let sourceRecord = this._sourceRecords.get(key);
    if (sourceRecord) {
      sourceRecord.add(path, data);
    } else {
      switch (type) {
        case ('callback'):
          sourceRecord = new CallbackSourceRecord(name, type, { path: path, sourceIdl: data });
          break;
        default:
          sourceRecord = new SourceRecord(name, type, { path: path, sourceIdl: data });
          break;
      }
      this._sourceRecords.set(key, sourceRecord)
    }
  }
}

class IDLSource extends _SourceProcessor_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }

  findExact(searchValOrArray, includeFlags=false, includeOriginTrials=false) {
    if (!this._sourceRecords.size) { this.getFeatureSources(); }
    let matches = new Map();
    if (searchValOrArray === '*') {
      for (let s of this._sourceRecords) {
        if (!includeFlags && s[1].inDevTrial) { continue; }
        if (!includeOriginTrials && s[1].inOriginTrial) { continue; }
        matches.set(s[0], s[1]);
      }
    } else if (Array.isArray(searchValOrArray)) {
      for (let s of this._sourceRecords) {
        const possibleMatch = searchValOrArray.includes(s.name);
        if (possibleMatch) {
          if (!includeFlags && s[1].inDevTrial) { continue; }
          if (!includeOriginTrials && s[1].inOriginTrial) { continue; }
          matches.set(s[0], s[1]);
        }
      }
    } else {
      for (let s of this._sourceRecords) {
        if (!s.name.includes(searchValOrArray)) { continue; }
        if (!includeFlags && s.inDevTrial) { continue; }
        if (!includeOriginTrials && s.inOriginTrial) { continue; }
        matches.set(s[0], s[1]);
      }
    }
    return matches;
  }
}

class ChromeIDLSource extends IDLSource {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);

  }
}

class CSSSource extends _SourceProcessor_Base {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);
  }
}

module.exports.ChromeIDLSource = ChromeIDLSource;
module.exports.CSSSource = CSSSource;
module.exports.IDLError = IDLError;