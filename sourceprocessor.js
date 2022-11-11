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

const EXCLUSIONS = ['inspector','testing','typed_arrays'];

class _SourceProcessor_Base {
  constructor(sourceLocation, options = {}) {
    this._sourcePaths = new Array();
    this._sourceRecords = new Map();
    this._processSource(sourceLocation);
  }

  _recordRecord(data, path) {
    if (!data) { return; }
    // let type, name;
    // [type, name] = this._getNameAndType(data, path);
    // let sourceRecord;
    // if (type === 'includes') {
    //   const matches = data.match(/\w*\s*includes\s*(\w*)/);
    //   const mixinSourceName = matches[1];
    //   const mixinRecord = this._sourceRecords.get(`${mixinSourceName}-mixin`);
    //   if (mixinRecord) {
    //     path = mixinRecord.sources[0].path;
    //     data = mixinRecord.sources[0].sourceIdl;
    //   }
    //   sourceRecord = this._sourceRecords.get(`${name}-interface`);
    //   if (sourceRecord) {
    //     sourceRecord.add(path, data);
    //   } else {
    //     sourceRecord = new SourceRecord(name, 'interface', { path: path, sourceIdl: data});
    //     this._sourceRecords.set(`${name}-interface`, sourceRecord);
    //   }
    // } else {
    //   sourceRecord = this._sourceRecords.get(`${name}-${type}`);
    //   if (sourceRecord) {
    //     sourceRecord.add(path, data);
    //   } else {
    //     switch (type) {
    //       case 'callback':
    //         sourceRecord = new CallbackSourceRecord(name, type, { path: path, sourceIdl: data});
    //         break;
    //       default:
    //         sourceRecord = new SourceRecord(name, type, { path: path, sourceIdl: data });
    //         break;
    //     }
    //     this._sourceRecords.set(`${name}-${type}`, sourceRecord);
    //   }
    // }
  }

}

class IDLSource {
  constructor(sourceLocation, options) {
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
    for (const s of this._sourcePaths) {
      let tree = utils.getIDL(s, true);

      for (let i = 0; i < tree.length; i++) {
        this._recordRecord(tree[i], s);
      }
    }
    return this._sourceRecords;
  }

  _recordRecord(data, sourcePath) {
    let sourceRecord;
    let dataType = data.type;
    if (data.partial===true && data.type==='interface') { dataType = 'partial'; }
    if (data.type==='callback interface') { dataType = 'callback-interface'; }
    if (data.type==='interface mixin') { dataType = 'interface-mixin'; }
    let name = data.name;
    if (data.type==='includes') { name = data.target; }

    sourceRecord = this._sourceRecords.get(`${name}-${dataType}`);
    if (sourceRecord) {
      sourceRecord.add(sourcePath, data);
    } else {
      switch (dataType) {
        case 'callback':
          sourceRecord = new CallbackSourceRecord(name, dataType, { path: sourcePath, sourceIdl: data});
          break;
        default:
          sourceRecord = new SourceRecord(name, dataType, { path: sourcePath, sourceIdl: data})
          break;
      }
      this._sourceRecords.set(`${name}-${dataType}`, sourceRecord);
    }
  }

  findExact(searchValOrArray, options = {}) {
    // if (!options.includeFlags) { options.includeFlags = false; }
    // if (!options.includeOriginTrials) { options.includeOriginTrials = false; }
    // if (!options.includeMixinSources) { options.includeMixinSources = false; }
    // if (!this._sourceRecords.size) { this.getFeatureSources(); }
    // let matches = new Map();
    // if (searchValOrArray === '*') {
    //   for (let s of this._sourceRecords) {
    //     if (!options.includeFlags && s[1].inDevTrial) { continue; }
    //     if (!options.includeOriginTrials && s[1].inOriginTrial) { continue; }
    //     if (!options.includeMixinSources && s[1].type === 'mixin') { continue; }
    //     matches.set(s[0], s[1]);
    //   }
    // } else if (Array.isArray(searchValOrArray)) {
    //   for (let s of this._sourceRecords) {
    //     const possibleMatch = searchValOrArray.includes(s.name);
    //     if (possibleMatch) {
    //       if (!options.includeFlags && s[1].inDevTrial) { continue; }
    //       if (!options.includeOriginTrials && s[1].inOriginTrial) { continue; }
    //       if (!options.includeMixinSources && s[1].type === 'mixin') { continue; }
    //       matches.set(s[0], s[1]);
    //     }
    //   }
    // } else {
    //   for (let s of this._sourceRecords) {
    //     if (!s.name.includes(searchValOrArray)) { continue; }
    //     if (!options.includeFlags && s.inDevTrial) { continue; }
    //     if (!options.includeOriginTrials && s.inOriginTrial) { continue; }
    //     if (!options.includeMixinSources && s[1].type === 'mixin') { continue; }
    //     matches.set(s[0], s[1]);
    //   }
    // }
    return matches;
  }
}

class ChromeIDLSource extends IDLSource {
  constructor(sourceLocation, options) {
    super(sourceLocation, options);

  }
}

module.exports.ChromeIDLSource = ChromeIDLSource;
module.exports.IDLError = IDLError;