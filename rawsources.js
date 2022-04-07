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

const { bcd } = require('./bcd.js');
const { FlagStatus } = require('./flags.js');
const { IDLError } = require('./errors.js');
const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

// For ue with string.match();
const INTERFACE_NAME_RE = /interface\s*(\w*)\s*:?\s*(\w*)\s*\{/;

// For use with string.matchAll();
const CONSTRUCTORS_RE = /constructor\(([^;]*)\);/g;
const METHODS_RE = /(?:\[[^\]]*\])?\s*(\w*)\s*(\w*)\(([^\)]*)\);/g;
const PROPERTIES_RE = /(?:\[[^\]]*\])?\s*(?:readonly)?\s*attribute\s*([^\s]*\??)\s(\w*);/g;
const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';

global.__Flags = FlagStatus();

class SourceRecord {
  #constructors;
  #interfaceName;
  #methods;
  #name;
  #properties;
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

  getConstructors(forIdlFile = 'allFiles') {
    if (!this.#constructors) {
      this.getMembers(forIdlFile);
    }
    return this.#constructors;
  }

  getMembers(forIdlFile = 'allFiles') {
    let searchSet = new Array();

    if (forIdlFile === 'allFiles') {
      searchSet.push(...this.#sources);
    } else {
      let found = this.#sources.find((s) => {
        return s.path === forIdlFile;
      });
      searchSet.push(found);
    }

    for (let s of searchSet) {
      let matches;

      // Get Constructors
      matches = s.sourceIdl.matchAll(CONSTRUCTORS_RE);
      if (matches) {
        this.#constructors = new Array();
        let conststructor;
        for (let m of matches) {
          conststructor = {
            name: this.interfaceName,
            returnType: this.interfaceName,
            arguments: undefined
          }
          if (m[1]) { conststructor.arguments = m[1].split(',')}
          this.#constructors.push(conststructor);
        }
      }

      // Get methods
      matches = s.sourceIdl.matchAll(METHODS_RE);
      if (matches) {
        this.#methods = new Array();
        let method;
        for (let m of matches) {
          method = {
            name: m[2],
            returnType: m[1],
            arguments: undefined
          }
          if (m[3]) { method.arguments = m[3].split(',')}
          this.#methods.push(method);
        }
      }

      // Get properties
      matches = s.sourceIdl.matchAll(PROPERTIES_RE);
      if (matches) {
        this.#properties = new Array();
        for (let m of matches) {
          if (m[1] === 'EventHandler') { continue; }
          this.#properties.push({ name: m[2], returnType: m[1] });
        }
      }

    }
  }

  getMethods(forIdlFile = 'allFiles') {
    if (!this.#methods) {
      this.getMembers(forIdlFile);
    }
    return this.#methods
  }

  getProperties(forIdlFile = 'allFiles') {
    if (!this.#properties) {
      this.getMembers(forIdlFile);
    }
    return this.#properties;
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
    nextSet = this.getConstructors(forIdlFile);
    if (nextSet) { ids.push(...nextSet); }
    nextSet = this.getMethods(forIdlFile);
    if (nextSet) { ids.push(...nextSet); }
    nextSet = this.getProperties(forIdlFile);
    if (nextSet) { ids.push(...nextSet); }
    return ids;
  }

  getKeys(forIdlFile = 'allFiles') {
    let propertySet = new Array();
    let nextSet;
    let keys = new Array();
    nextSet = this.getConstructors(forIdlFile);
    propertySet.push(...nextSet);
    nextSet = this.getMethods(forIdlFile);
    propertySet.push(...nextSet);
    nextSet = this.getProperties(forIdlFile);
    propertySet.push(...nextSet);
    if (propertySet) {
      keys.push(this.interfaceName);
      for (let p of propertySet) {
        keys.push(`${this.interfaceName}.${p.name}`);
      }
    }
    return keys;
  }

  getBurnRecords(forIdlFile = 'allFiles') {
    let records = new Array();
    let keys = this.getKeys(forIdlFile);
    for (let k of keys) {
      const newRecord = this._buildRecord(k);
      records.push(newRecord);
    }
    return records;
  }

  _buildRecord(keyName) {
    // let keyName = (memberName? `${this.interfaceName}.${memberName}`: memberName);
    let record = bcd.getRecordByKey(keyName, 'api');
    record.flag = this.flagStatus;
    record.name = keyName;
    // record.origin_trial = this.origin_trial;
    record.type = this.#type;
    const engines = bcd.getEngines(keyName, 'api');
    record.engineCount = (engines? engines.length: 1);
    const browserCount = bcd.getBrowsers(keyName, 'api');
    record.browserCount = (browserCount? browserCount.length: 6);
    const browsers = ['chrome', 'chrome_android', 'webview_android'];
    const versions = bcd.getVersions(keyName, browsers, 'api');
    record.versions = versions;
    return record;
  }

  getUrls(forIdlFile = 'allFiles') {
    let keys = this.getKeys(forIdlFile);
    let urls = new Array();
    for (let k of keys) {
      let newK = k.replace('.', '/');
      urls.push(`${URL_BASE}${newK}`);
    }
    return urls;
  }
}

module.exports.SourceRecord = SourceRecord;