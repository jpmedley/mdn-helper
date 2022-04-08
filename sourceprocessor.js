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

const CALLBACK_NAME = /callback\s*(\w*)[^;]*;/;
const CALLBACK_INTERFACE_NAME = /callback\s*interface\s*(\w*)\s*\{/;
const DICTIONARY_NAME = /dictionary\s*(\w*)[^\{]*\{/;
const ENUM_NAME = /enum\s*(\w*)\s*\{/;
const INCLUDES_NAME = /(\w*)\sincludes\s[^;]*;/;
const INTERFACE_NAME = /\]?\s*interface\s*(\w*)[^\{]*\{/;
const MIXIN_NAME = /\]?\s*interface\s*mixin\s*(\w*)\s*\{/;
const NAMESPACE_NAME = /\]?\s*namespace\s*(\w*)[^\{]*\{/;
const PARTIAL_NAME = /\]?\s*partial\s*interface\s*(\w*)\s[^\{]*\{/;
const TYPEDEF_NAME_SIMPLE = /typedef\s*[^\s]*\s*(\w*);/;
const TYPEDEF_NAME_COMPOUND = /typedef\s*\([^\)]*\)\s*(\w*);/;
const TYPEDEF_NAME_COMPLEX = /typedef\s*(?:\w*\s*){3}(\w*);/;

const KEYWORDS = ['callback', 'dictionary', 'enum', 'includes', 'interface', 'mixin', 'namespace', 'typedef'];

class _SourceProcessor_Base {
  #EXCLUSIONS = [];
  #sourceLocation = '';
  #sourcePaths = [];
  #sourceRecords = new Map();
  constructor(sourceLocation, options = {}) {
    this.#sourceLocation = sourceLocation;
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
    const contents = fs.readdirSync(`${root}`, {withFileTypes: true});
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
        const msg = `Cannot process ${p}.`;
        global.__logger.info(`Cannot process ${p}.`);
        throw new IDLError(msg);
      }
      const lines = rawData.split('\n');
      let currentStructure = '';
      let name = '';
      let type = '';
      for (const l of lines) {
        let headerLine = (() => {
          if (l.trim().startsWith('[') && (!l.trim().endsWith(';'))) {
            return true;
          }
          let found = KEYWORDS.some((e) => {
            // Spaces are needed to prvent false positives.
            // (Enums may contain these keywords in quotes.)
            return l.includes(`${e} `);
          });
          if (found && (!l.trim().startsWith(']'))) { return true; }
          return false;
        })();

        if (headerLine) {
          if (name) {
            this._recordRecord(name, type, currentStructure, p);
          }
          currentStructure = '';
          type = '';
          name = '';
        }
        if (!type) {
          type = (() => {
            if (l.includes('callback interface')) { return 'callback-interface'; }
            if (l.includes('interface mixin')) { return 'mixin'; }
            if (l.includes('partial interface')) { return 'partial'; }
            return KEYWORDS.find((e) => {
             var rx = new RegExp(`\\b${e}`);
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
              }
              throw error;
            }
          }
        }
        currentStructure += `${l}\n`;
      }
      if (name) {
        this._recordRecord(name, type, currentStructure, p);
      }
    }
    return this.#sourceRecords;
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

  _recordRecord(name, type, data, path) {
    let key = `${name}-${type}`;
    let sourceRecord = this.#sourceRecords.get(key);
    if (sourceRecord) {
      sourceRecord.add(path, data);
    } else {
      sourceRecord = new SourceRecord(name, type, { path: path, sourceIdl: data });
      this.#sourceRecords.set(key, sourceRecord)
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