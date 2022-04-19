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
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');

initiateLogger(global.__commandName);

// For ue with string.match();
const INTERFACE_NAME_RE = /interface\s*(\w*)\s*:?\s*(\w*)\s*\{/;

// For use with string.matchAll();
const CONSTRUCTORS_RE = /constructor\(([^;]*)\);/g;
const METHODS_RE = /(?:\[[^\]]*\])?\s*([^\s]*)\s*(\w*)\(([^\)]*)\);/g
const PROPERTIES_RE = /(?:\[[^\]]*\])?\s*(?:readonly)?\s*attribute\s*([^\s]*\??)\s(\w*);/g;
const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';

global.__Flags = FlagStatus();

class SourceRecord {
  #constructors;
  #events;
  #interfaceName;
  #methods;
  #name;
  #properties;
  #propertySearch = false;
  #runtimeFlag;
  #searchSet;
  #sources = new Array();
  #type;

  constructor(name, type, options) {
    this.#name = name;
    this.#type = type;
    this.add(options.path, options.sourceIdl);
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

  get inOriginTrial() {
    if (this.flagStatus === 'origintrial') { return true; }
    return false;
  }

  get inDevTrial() {
    if (this.flagStatus === 'devtrial') { return true; }
    return false;
  }

  get key() {
    // For the interface, the name and the key are identical.
    return this.#name;
  }

  get name() {
    return this.#name;
  }

  get sources() {
    return this.#sources;
  }

  get type() {
    return this.#type;
  }

  add(path, sourceIdl) {
    let source = {
      path: path,
      sourceIdl: sourceIdl
    }
    this.#sources.push(source);
  }

  getAllMembers(forIdlFile = 'allFiles') {
    let nextSet;
    let members = new Array();

    nextSet = this.getConstructors(forIdlFile);
    if (nextSet) { members.push(...nextSet); }
    nextSet = this.getEvents(forIdlFile);
    if (nextSet) { members.push(...nextSet); }
    nextSet = this.getMethods(forIdlFile);
    if (nextSet) { members.push(...nextSet); }
    nextSet = this.getProperties(forIdlFile);
    if (nextSet) { members.push(...nextSet); }

    return members;
  }

  getBurnRecords(forIdlFile = 'allFiles') {
    let records = new Array();
    let iface = { name: this.name, key: this.name }
    let newRecord = this._buildRecord(iface);
    records.push(newRecord)
    let members = this.getAllMembers(forIdlFile);
    for (let m of members) {
      newRecord = this._buildRecord(m);
      records.push(newRecord);
    }
    return records;
  }

  getConstructors(forIdlFile = 'allFiles') {
    if (!this.#constructors) {
      const searchSet = this._getSearchSet(forIdlFile);
      let matches;
      for (let s of searchSet) {
        matches = s.sourceIdl.matchAll(CONSTRUCTORS_RE);
        if (matches) {
          this.#constructors = new Array();
          let conststructor;
          for (let m of matches) {
            conststructor = {
              key: `${this.interfaceName}.${this.interfaceName}`,
              name: this.interfaceName,
              returnType: this.interfaceName,
              arguments: this._getArguments(m[1])
            }
            this.#constructors.push(conststructor);
          }
        }
      }
    }
    return this.#constructors;
  }

  getEvents(forIdlFile = 'allFiles') {
    if (!this.#events) {
      this._processProperties(forIdlFile);
    }
    return this.#events;
  }

  getKeys(forIdlFile = 'allFiles') {
    let propertySet = new Array();
    let nextSet;
    let keys = new Array();

    nextSet = this.getConstructors(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getEvents(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getMethods(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getProperties(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }

    keys.push(this.interfaceName);
    if (propertySet) {
      for (let p of propertySet) {
        keys.push(p.key);
      }
    }
    return keys;
  }

  getMethods(forIdlFile = 'allFiles') {
    if (!this.#methods) {
      const searchSet = this._getSearchSet(forIdlFile);
      let matches;
      for (let s of searchSet) {
        matches = s.sourceIdl.matchAll(METHODS_RE);
        if (matches) {
          this.#methods = new Array();
          let method;
          for (let m of matches) {
            method = {
              key: `${this.interfaceName}.${m[2]}`,
              name: m[2],
              returnType: m[1],
              arguments: this._getArguments(m[3])
            }
            this.#methods.push(method);
          }
        }
      }
    }
    return this.#methods
  }

  getProperties(forIdlFile = 'allFiles') {
    if (!this.#properties) {
      this._processProperties(forIdlFile);
    }
    return this.#properties;
  }

  getSecureContext() {
    return this.#sources.some((s) => {
      return s.sourceIdl.includes('SecureContext');
    });
  };

  getUrls(forIdlFile = 'allFiles') {
    let keys = this.getKeys(forIdlFile);
    let urls = new Array();
    for (let k of keys) {
      let newK = k.replace('.', '/');
      urls.push(`${URL_BASE}${newK}`);
    }
    return urls;
  }

  async ping(verboseOutput = true) {
    let pingRecords = this.getBurnRecords();
    const pinger = new Pinger(pingRecords)
    if (verboseOutput) {
      utils.sendUserOutput('\nChecking for existing MDN pages. This may take a few minutes.');
    }
    let records = await pinger.pingRecords()
    .catch((e) => {
      throw e;
    });
    return records;
  }

  _buildRecord(member) {
    let record = bcd.getRecordByKey(member.key, 'api');
    record.flag = this.flagStatus;
    record.name = member.name;
    // record.origin_trial = this.origin_trial;
    record.type = member.type;
    const engines = bcd.getEngines(member.key, 'api');
    record.engineCount = (engines? engines.length: 1);
    const browserCount = bcd.getBrowsers(member.key, 'api');
    record.browserCount = (browserCount? browserCount.length: 6);
    const browsers = ['chrome', 'chrome_android', 'webview_android'];
    const versions = bcd.getVersions(member.key, browsers, 'api');
    record.versions = versions;
    return record;
  }

  _getArguments(argumentString) {
    if (!argumentString) { return undefined; }
    if (argumentString.includes('<')) {
      const COMPOUND_ARG_RE = /<[^>]*>/g;
      const matches = argumentString.matchAll(COMPOUND_ARG_RE)
      for (let m of matches) {
        let tempArg = m[1].replace(',', '%%');
        argumentString = argumentString.replace(m[1], tempArg);
      }
    }
    let returns = argumentString.split(',');
    for (let r of returns) {
      r = r.replace('%%', ',');
    }
    return returns;
  }

  _getSearchSet(forIdlFile = 'allFiles') {
    if (!this.#searchSet) {
      this.#searchSet = new Array();
  
      if (forIdlFile === 'allFiles') {
        this.#searchSet.push(...this.#sources);
      } else {
        let found = this.#sources.find((s) => {
          return s.path === forIdlFile;
        });
        this.#searchSet.push(found);
      }
    }
    return this.#searchSet;
  }

  _processProperties(forIdlFile = 'allFiles') {
    if (this.#propertySearch) { return; }
    const searchSet = this._getSearchSet(forIdlFile);
    let matches;
    for (let s of searchSet) {
      let matches = s.sourceIdl.matchAll(PROPERTIES_RE);
      if (matches) {
        let property;
        for (let m of matches) {
          if (m[1] === 'EventHandler') {
            if (!this.#events) { this.#events = new Array(); }
            property = {
              key: `${this.interfaceName}.${m[2].trim().slice(2)}_event`,
              name: m[2],
              returnType: m[1]
            }
            this.#events.push(property);
          } else {
            if (!this.#properties) { this.#properties = new Array(); }
            property = {
              key: `${this.interfaceName}.${m[2]}`,
              name: m[2],
              returnType: m[1]
            }
            this.#properties.push(property);
          }
        }
      }
    }
    this.#propertySearch = true;
  }
}

module.exports.SourceRecord = SourceRecord;