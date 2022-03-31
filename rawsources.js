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
const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

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
  #name
  #properties
  #runtimeFlag
  #sources = new Array();
  #type
  #urls

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

  get urls() {
    if (this.#urls) { return this.#urls; }
    this.#urls = new Array();
    this.#urls.push(`${URL_BASE}${this.name}`)
    let properties = this.properties;
    for (let p of properties) {
      this.#urls.push(`${URL_BASE}${this.name}/${p.name}`);
    }
    return this.#urls;
  }
}

module.exports.SourceRecord = SourceRecord;