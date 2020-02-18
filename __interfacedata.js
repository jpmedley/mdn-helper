// Copyright 2019 Google LLC
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

const { Pinger } = require("./pinger.js");

const EMPTY_BURN_DATA = Object.freeze({
  key: null,
  bcd: null,
  flag: null,
  mdn_exists: null,
  mdn_url: '',
  origin_trial: null,
  redirect: null,
  type: ''
});

const CALLBACK_NAME_RE = /callback\s(\w+)/;
const DICTIONARY_NAME_RE = /dictionary\s(\w+)/;
const ENUM_NAME_RE = /enum\s(\w+)/;
const INTERFACE_NAME_RE = /interface\s(\w+)/;


const CONSTRUCTOR_RE = /constructor\(([^)]*)\)/g;
const DELETER_RE = /(^.*deleter).*;/gm;
const EVENTHANDLER_RE = /(\[([^\]]*)\])?(\sreadonly)?\sattribute\sEventHandler\s(\w+)/g;
const GETTERS_RE = /getter([^(]+)\(/g;
const ITERABLE_RE = /iterable\<[^\>]*>/g;
const MAPLIKE_RE = /maplike\<[^\>]*>/g;
const METHOD_PROMISE_RE = /\[([^\]]*)\]\sPromise<([^>]*)>{1,2}\s(\w+)\(([^\)]*)/g; // Name at index 3
const METHOD_RE = /\[([^\]]*)\]\s(\w+)\s(\w+)\(([^\)]*)/g; // Name at index 3
const PROPERTY_READONLY_RE = /(\[([^\]]*)\])?(\sreadonly)\sattribute\s(\w+)\s(\w+)/g;
const PROPERTY_READWRITE_RE = /(\[([^\]]*)\])?[^(\sreadonly)]\sattribute\s(\w+)\s(\w+)/g;
const SETTERS_RE = /setter([^(]+)\(/g;

const DELETER_NAME_RE = /void([^(]*)\(/;
const DELETER_UNNAMED = '';
const EVENT_NAME_RE = /EventHandler\s([^;]*)/;
const GETTER_NAME_RE = /getter(\s([^\s^(]+)){2}/;
const GETTER_UNAMED_RE = /getter(\s([^\s]+))\s\(/;
// const EVENT_NAME_RE
const SETTER_NAME_RE = /setter(\s([^\s^(]+)){2}/;
const SETTER_UNAMED_RE = /setter\svoid\s\(/;

const METHOD = Object.freeze({
  "name": null,
  "returnType": null,
  "resolutions": null,
  "arguments": []
});

const PROPERTY = Object.freeze({
  "name": null,
  "returnType": null,
  "readOnly": null
})

class IDLData {
  constructor(source, options = {}) {
    this._sourceData = source;
    this._name;
  }

  get key() {
    return this.name;
  }

  get sourcePath() {
    return this._sourcePath;
  }

  set sourcePath(path) {
    this._sourcePath = path;
  }

  get type() {
    return this._type;
  }

  getBurnRecords() {
    let record = Object.assign({}, EMPTY_BURN_DATA);
    record.key = this.key;
    record.flag = this.flag;
    record.origin_trial = this.originTrial;
    record.type = this.type;
    let bcdData = global._bcd.getByKey(`api.${record.key}`);
    record.bcd = bcdData ? true : false;
    return new Array(record);
  }

  async ping(verboseOutput = true) {
    let pingRecords = this.getBurnRecords();
    const pinger = new Pinger(pingRecords);
    if (verboseOutput) {
      console.log('\nChecking for existing MDN pages. This may take a few minutes.');
    }
    let records = await pinger.pingRecords(verboseOutput)
    .catch(e => {
      throw e;
    });
    return records;
  }
  // Original line 113
}

class CallbackData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "callback";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(CALLBACK_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class DictionaryData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "dictionary";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(DICTIONARY_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class EnumData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "enum";
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(ENUM_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }
}

class InterfaceData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
    this._type = "interface";
    this._allProperties = null;
    this._constructors = null;
    this._deleters = null;
    this._eventHandlers = null;
    this._getter = null;
    this._hasConstructor = null;
    this._interable = null;
    this._methods = null;
    this._readOnlyProperties = null;
    this._readWriteProperties = null;
    this._setter = null;
  }

  get constructors() {
    if (!this._constructors) {
      let matches = this._sourceData.match(CONSTRUCTOR_RE);
      if (matches) {
        this._constructors = [];
        matches.forEach(elem => {
          let constructors = elem.match(CONSTRUCTOR_RE);
          let constructor_ = constructors[0].trim();
          if (!this._constructors.includes(constructor_)) {
            this._constructors.push(constructor_);
          }
        });
      }
    }
    return this._constructors;
  }

  get constructors() {
    if (!this._constructors) {
      let matches = this._sourceData.match(CONSTRUCTOR_RE);
      if (matches) {
        this._constructors = [];
        matches.forEach(elem => {
          let constructors = elem.match(CONSTRUCTOR_RE);
          let constructor_ = constructors[0].trim();
          if (!this._constructors.includes(constructor_)) {
            this._constructors.push(constructor_);
          }
        });
      }
    }
    return this._constructors;
  }

  get deleters() {
    if (!this._deleters) {
      let matches = this._sourceData.match(DELETER_RE);
      if (matches) {
        this._deleters = [];
        matches.forEach(elem => {
          let deleters = elem.match(DELETER_NAME_RE);
          let deleter = deleters[1].trim();
          if (!this._deleters.includes(deleter)) {
            this._deleters.push(deleter);
          }
        });
      }
    }
    return this._deleters;
  }

  get eventHandlers() {
    if (!this._eventHandlers) {
      let matches = this._sourceData.match(EVENTHANDLER_RE);
      if (matches) {
        this._eventHandlers = [];
        matches.forEach(elem => {
          let eventHandlers = elem.match(EVENT_NAME_RE);
          let eventHandler = eventHandlers[1].trim();
          if (!this._eventHandlers.includes(eventHandler)) {
            this._eventHandlers.push(eventHandler);
          }
        });
      }
    }
    return this._eventHandlers;
  }

  get getter() {
    if (!this._getter) {
      let matches = this._sourceData.match(GETTERS_RE);
      if (matches) {
        const getter = matches.find(elem => {
          return elem.match(GETTER_UNAMED_RE);
        });
        if (getter) {
          this._getter = true;
        } else {
          this._getter = false;
        }
      } else {
        this._getter = false;
      }
    }
    return this._getter
  }

  get hasConstructor() {
    if (!this._hasConstructor) {
      let matches = this._sourceData.match(CONSTRUCTOR_RE);
      if (matches) {
        this._hasConstructor = true;
      } else {
        this._hasConstructor = false;
      }
    }
    return this._hasConstructor;
  }

  get iterable() {
    if (!this._iterable) {
      let matches = this._sourceData.match(ITERABLE_RE);
      if (matches) {
        this._iterable = true;
      } else {
        this._iterable = false;
      }
    }
    return this._iterable;
  }

  get methods() {
    if (!this._methods) {
      this._methods = [];
      let matches = this._sourceData.matchAll(METHOD_RE);
      let match = matches.next();
      while (!match.done) {
        let method = Object.assign({}, METHOD);
        method.returnType = match.value[2];
        method.name = `${match.value[3]}()`;
        if (match.value[4]) {
          method.arguments = match.value[4].split(',');
        }
        this._methods.push(method);
        match = matches.next();
      }
      matches = this._sourceData.matchAll(METHOD_PROMISE_RE);
      match = matches.next();
      while (!match.done) {
        let method = Object.assign({}, METHOD);
        method.resolutions = match.value[2];
        method.name = `${match.value[3]}()`;
        method.returnType = "Promise";
        if (match.value[4]) {
          method.arguments = match.value[4].split(',');
        }
        this._methods.push(method);
        match = matches.next();
      }
    }
    return this._methods
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(INTERFACE_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
  }

  get properties() {
    if (!this._allProperties) {
      this._allProperties = [];
      let props = this.readOnlyProperties;
      if (props) { this._allProperties.push(...props); }
      props = this.readWriteProperties;
      if (props) { this._allProperties.push(...props); }
    }
    return this._allProperties;
  }

  get readOnlyProperties() {
    if (!this._readOnlyProperties) {
      let matches = this._sourceData.matchAll(PROPERTY_READONLY_RE);
      let match = matches.next();
      if (!match.done) { this._readOnlyProperties = []; }
      while (!match.done) {
        let prop = Object.assign({}, PROPERTY);
        prop.name = match.value[5];
        prop.readOnly = true;
        prop.returnType = match.value[4];
        this._readOnlyProperties.push(prop);
        match = matches.next();
      }
    }
    return this._readOnlyProperties;
  }

  get readWriteProperties() {
    if (!this._readWriteProperties) {
      let matches = this._sourceData.matchAll(PROPERTY_READWRITE_RE);
      let match = matches.next();
      if (!match.done) { this._readWriteProperties = []; }
      while (!match.done) {
        if (match.value[3] != 'EventHandler') {
          let prop = Object.assign({}, PROPERTY);
          prop.name = match.value[4];
          prop.readOnly = false;
          prop.returnType = match.value[3];
          this._readWriteProperties.push(prop);
        }
        match = matches.next();
      }
    }
    return this._readWriteProperties;
  }

  get setter() {
    if (!this._setter) {
      let matches = this._sourceData.match(SETTERS_RE);
      if (matches) {
        const setter = matches.find(elem => {
          return elem.match(SETTER_UNAMED_RE);
        });
        if (setter) {
          this._setter = true;
        } else {
          this._setter = false;
        }
      } else {
        this._setter = false;
      }
    }
    return this._setter
  }

  getBurnRecords() {
    // Gets the burn record for the interface itself.
    let records = super.getBurnRecords();
    for (let k of this.keys) {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.key = k;

    }
  }
}


module.exports.InterfaceData = InterfaceData;