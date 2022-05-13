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
const INTERFACE_NAME_RE = /(?:interface|namespace)\s*(\w*)\s*:?\s*(\w*)\s*\{/;

// For use with string.matchAll();
const CONSTRUCTORS_RE = /constructor\(([^;]*)\);/g;
const METHODS_RE = /(?:\[[^\]]*\])?\s*([^\s]*)\s*(\w*)\s*\(([^\)]*)\);/g
const PROPERTIES_RE = /(?:\[[^\]]*\])?\s*(?:readonly)?\s*attribute\s*([^\s]*\??)\s(\w*);/g;
const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';

global.__Flags = FlagStatus();

class _sourceRecord_Base {
  constructor(name, type, options) {
    this._sources = new Array();
    this._name = name;
    this._type = type;
    this.add(options.path, options.sourceIdl);
  }


  add(path, sourceIdl) {
    let source = {
      path: path,
      sourceIdl: sourceIdl
    }
    this._sources.push(source);
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
  
  get name() {
    return this._name;
  }

  get type() {
    return this._type;
  }

  get key() {
    // For the interface, the name and the key are identical.
    return this._name;
  }

  get sources() {
    return this._sources;
  }
}

class CallbackSourceRecord extends _sourceRecord_Base {

  constructor(name, type, options) {
    super(name, type, options);
    this._type = 'callback';
  }

  getBurnRecords(forIdlFile = 'allFiles') {
    let records = new Array();
    let cback = { name: this.name, key: this.name }
    let newRecord = this._buildRecord(cback);
    records.push(newRecord);
    return records;
  }
}

class InterfaceSourceRecord extends _sourceRecord_Base {
  #constructors;
  #deleters;
  #events;
  #flag;
  #methods;
  #namedGetters;
  #namedSetters;
  #properties;
  #propertySearch = false;
  #runtimeFlag;
  #searchSet;

  constructor(name, type, options) {
    super(name, type, options);
    this._name = name;
    this._type = type;
  }

  _isFlagFirst(source) {
    const STRUCTURES = ['callback', 'dictionary', 'enum', 'interface', 'namespace'];
    const pieces = source.split('RuntimeEnabled');
    const structureFirst = STRUCTURES.some(s => {
      return pieces[0].includes(s);
    });
    return !structureFirst;
  }

  get flag() {
    if (!this.#flag) {
      const interfaceLevelFlag = this._sources.find(s => {
        return this._isFlagFirst(s.sourceIdl);
      });
      if (interfaceLevelFlag) {
        const RUNTIME_ENABLED_RE = /RuntimeEnabled\s*=\s*(\w*)/;
        const matches = this._sources[0].sourceIdl.match(RUNTIME_ENABLED_RE);
        if (matches) {
          return matches[1].trim();
        }
      }
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
    return this.name;
  }

  get inOriginTrial() {
    if (this.flagStatus === 'origintrial') { return true; }
    return false;
  }

  get inDevTrial() {
    if (this.flagStatus === 'devtrial') { return true; }
    return false;
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

  getDeleters(forIdlFile = 'allFiles') {
    if (!this.#deleters) {
      const searchSet = this._getSearchSet(forIdlFile);
      for (let s of searchSet) {
        let matches = s.sourceIdl.matchAll(/deleter\s*void\s*(\w*)\(([^\)]*)\);/g);
        if (matches) {
          if (!this.#deleters) { this.#deleters = new Array(); }
          let deleter;
          for (let m of matches) {
            if (!m[1]) { continue; }
            deleter = {
              key: `${this.interfaceName}.${m[1]}`,
              name: m[1],
              returnType: 'void',
              arguments: m[2].split(',')
            }
            this.#deleters.push(deleter);
          }
        }
      }
    }
    return this.#deleters
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
    nextSet = this.getDeleters(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getEvents(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getMethods(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getProperties(forIdlFile);
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getNamedGetters();
    if (nextSet) { propertySet.push(...nextSet); }
    nextSet = this.getNamedSetters();
    if (nextSet) { propertySet.push(...nextSet); }

    keys.push(this.interfaceName);
    if (propertySet) {
      for (let p of propertySet) {
        keys.push(p.key);
      }
    }
    return keys;
  }

  _getIterableMethods(sourceIdl) {
    let methods = new Array();
    const ITERABLE_METHODS = ['entries', 'forEach', 'keys', 'values'];
    const ITERABLE_RETURN_TYPES = ['array', 'undefined', 'array', 'array'];
    let method;
    for (let im in ITERABLE_METHODS) {
      method = {
        key: `${this.interfaceName}${ITERABLE_METHODS[im]}`,
        name: ITERABLE_METHODS[im],
        returnType: ITERABLE_RETURN_TYPES[im],
        arguments: ''
      }
      methods.push(method);
    }
    return methods;
  }

  _getMaplikeMethods(sourceIdl) {
    let methods = new Array();
    let match = sourceIdl.match(/(readonly\s)?maplike/);
    let MAPLIKE_METHODS = ["entries", "forEach", "get", "has", "keys", "size", "values"];
    let MAPLIKE_METHOD_RETURNS = ["sequence", "void", "", "boolean", "sequence", "long long", "sequence"];
    if (match[1]?.trim() != 'readonly') {
      MAPLIKE_METHODS.push(...["clear", "delete", "set"]);
      MAPLIKE_METHOD_RETURNS.push(...["void", "void", "void"]);
    }
    let method;
    for (let mm in MAPLIKE_METHODS) { 
      method = {
        key: `${this.interfaceName}.${MAPLIKE_METHODS[mm]}`,
        name: MAPLIKE_METHODS[mm],
        returnType: MAPLIKE_METHOD_RETURNS[mm],
        arguments: ''
      }
      methods.push(method);
    }
    return methods;
  }

  _getSetlikeMethods(sourceIdl) {
    let methods = new Array();
    let match = sourceIdl.match(/(readonly\s)?setlike/)
    let SETLIKE_METHODS = ["entries", "forEach", "has", "keys", "size", "values"];
    let SETLIKE_METHOD_RETURNS = ["sequence", "void", "boolean", "sequence", "long long", "sequence"];
    if (match[1]?.trim() != 'readonly') {
      SETLIKE_METHODS.push(...["add", "clear", "delete"]);
      SETLIKE_METHOD_RETURNS.push(...["void", "void", "void"]);
    }
    let method;
    for (let sm in SETLIKE_METHODS) {
      method = {
        key: `${this.interfaceName}.${SETLIKE_METHODS[sm]}`,
        name: SETLIKE_METHODS[sm],
        returnType: SETLIKE_METHOD_RETURNS[sm],
        arguments: ''
      }
      methods.push(method);
    }
    return methods;
  }

  getMethods(forIdlFile = 'allFiles') {
    if (!this.#methods) {
      const searchSet = this._getSearchSet(forIdlFile);
      let matches;
      let method;
      for (let s of searchSet) {
        if (s.sourceIdl.includes('stringifier')) {
          method = {
            key: `${this.interfaceName}.toString`,
            name: 'toString',
            returnType: 'string',
            arguments: ''
          }
          this.#methods = new Array();
          this.#methods.push(method);
        }

        let newMethods;
        if (s.sourceIdl.includes('iterable')) {
          if (!this.#methods) { this.#methods = new Array(); }
          newMethods = this._getIterableMethods(s.sourceIdl);
          if (newMethods.length > 0) {
            this.#methods.push(...newMethods);
          }
        }

        if (s.sourceIdl.includes('maplike')) {
          if (!this.#methods) { this.#methods = new Array(); }
          newMethods = this._getMaplikeMethods(s.sourceIdl);
          if (newMethods.length > 0) {
            this.#methods.push(...newMethods);
          }
        }

        if (s.sourceIdl.includes('setlike')) {
          if (!this.#methods) { this.#methods = new Array(); }
          newMethods = this._getSetlikeMethods(s.sourceIdl);
          if (newMethods.length > 0) {
            this.#methods.push(...newMethods);
          }
        }

        matches = s.sourceIdl.matchAll(METHODS_RE);
        if (matches) {
          if(!this.#methods) { this.#methods = new Array(); }
          for (let m of matches) {
            if (m[1] === 'constructor') { continue; }
            if (m[2] == '') { continue; }
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

  getNamedGetters(forIdlFile = 'allFiles') {
    if (!this.#namedGetters) {
      const searchSet = this._getSearchSet(forIdlFile);
      for (let s of searchSet) {
        let matches = s.sourceIdl.matchAll(/getter\s*(\w*)\s*(\w*)/g);
        if (!this.#namedGetters) { this.#namedGetters = new Array(); }
        for (let m of matches) {
          if (!m[2]) { continue; }
          let namedGetter = {
            key: `${this.interfaceName}.${m[2]}`,
            name: m[2],
            returnType: m[1],
            arguments: ''
          }
          this.#namedGetters.push(namedGetter);
        }
        matches = s.sourceIdl.matchAll(/getter\s*\(([^\)]*)\)(\?)?\s*(\w*)/g);
        if (!matches) { continue; }
        for (let m of matches) {
          if (!m[3]) { continue; }
          let namedGetter = {
            key: `${this.interfaceName}.${m[3]}`,
            name: m[3],
            returnType: m[1],
            arguments: ''
          }
          this.#namedGetters.push(namedGetter);
        }
      }
    }
    return this.#namedGetters
  }

  getNamedSetters(forIdlFile = 'allFiles') {
    if (!this.#namedSetters) {
      const searchSet = this._getSearchSet(forIdlFile);
      for (let s of searchSet) {
        let matches = s.sourceIdl.matchAll(/setter\s*void\s*(\w*)\(([^\)]*)\);/g);
        if (!this.#namedSetters) { this.#namedSetters = new Array(); }
        for (let m of matches) {
          if (!m[1]) { continue; }
          let namedSetter = {
            key: `${this.interfaceName}.${m[1]}`,
            name: m[1],
            returnType: 'void',
            arguments: m[2].split(',')
          }
          this.#namedSetters.push(namedSetter);
        }
      }
    }
    return this.#namedSetters
  }

  getProperties(forIdlFile = 'allFiles') {
    if (!this.#properties) {
      this._processProperties(forIdlFile);
    }
    return this.#properties;
  }

  getSecureContext() {
    return this._sources.some((s) => {
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

  _getArguments(argumentString) {
    if (!argumentString) { return undefined; }
    if (argumentString.includes('<')) {
      const COMPOUND_ARG_RE = /<([^>]*)>/g;
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
        this.#searchSet.push(...this._sources);
      } else {
        let found = this._sources.find((s) => {
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

module.exports.CallbackSourceRecord = CallbackSourceRecord;
module.exports.InterfaceSourceRecord = InterfaceSourceRecord;
module.exports.SourceRecord = InterfaceSourceRecord;