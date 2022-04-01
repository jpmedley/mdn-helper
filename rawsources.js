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

const { FlagStatus } = require('./flags.js');
const { IDLError } = require('./errors.js');
const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

// For ue with string.match();
const INTERFACE_NAME_RE = /interface\s*(\w*)\s*\{/;

// For use with string.matchAll();
const PROPERTIES_RE = /(?:\[[^\]]*\])?\s*(?:readonly)?\s*attribute\s*([^\s]*\??)\s(\w*);/g
const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';

global.__Flags = FlagStatus();

// #sources is an array of objects with this structure:
// {
//    path,
//    sourceIdl, 
//    properties[]: { name, returnType }
// }

class SourceRecord {
  #interfaceName;
  #name;
  #runtimeFlag;
  #sources = new Array();
  #type;


  constructor(name, type, options) {
    this.#name = name;
    this.#type = type;
    this.add(options.path, options.sourceIdl);
  }

  add(path, sourceIdl) {
    let source = {
      path: path,
      sourceIdl: sourceIdl
    }
    this.#sources.push(source);
  }

  get flag() {
    const RUNTIME_ENABLED_RE = /RuntimeEnabled\s*=\s*(\w*)/;
    const matches = this.#sources[0].sourceIdl.match(RUNTIME_ENABLED_RE);
    if (matches) {
      return matches[1].trim();
    }
  }

  get flagStatus() {
    if (!this.#runtimeFlag) {
      const flag = this.flag;
      if (flag) {
        this.#runtimeFlag = global.__Flags.getHighestResolvedStatus(flag);
      }
    }
    return this.#runtimeFlag;
  }

  get interfaceName() {
    if (this.#interfaceName) { return this.#interfaceName; }
    let match = this.#sources[0].sourceIdl.match(INTERFACE_NAME_RE);
    if (match) {
      this.#interfaceName = match[1];
    } else {
      const msg = `Malformed or missing IDL in ${this.sources[0].path}.\n\n${this.sources[0].sourceIdl}`
      throw new IDLError(msg, this.sources[0].path);
    }
    return this.#interfaceName;
  }

  get name() {
    return this.#name;
  }

  getProperties(forIdlFile = 'allFiles') {
    let searchSet = new Array();
    let returns;
    if (forIdlFile === 'allFiles') {
      searchSet.push(...this.#sources);
    } else {
      let found = this.#sources.find((s) => {
        return s.path === forIdlFile;
      });
      searchSet.push(found);
    }
    if (searchSet) { returns = new Array(); }
    for (let s of searchSet) {
      let matches = s.sourceIdl.matchAll(PROPERTIES_RE);
      if (matches) {
        for (let m of matches) {
          if (m[1] === 'EventHandler') { continue; }
          returns.push( { name: m[2], returnType: m[1]});
        }
      }
    }
    return returns;
  }

  get sources() {
    return this.#sources;
  }

  get type() {
    return this.#type;
  }

  getAllIds(forIdlFile = 'allFiles') {
    let nextSet;
    let ids = new Array();
    nextSet = this.getProperties(forIdlFile);
    if (nextSet) { ids.push(...nextSet); }
    return ids;
  }

  getUrls(forIdlFile = 'allFiles') {
    let ids = this.getAllIds(forIdlFile);
    let urls = new Array()
    urls.push(`${URL_BASE}${this.interfaceName}`);
    for (let i of ids) {
      urls.push(`${URL_BASE}${this.interfaceName}/${i.name}`);
    }
    return urls;
  }
}

module.exports.SourceRecord = SourceRecord;