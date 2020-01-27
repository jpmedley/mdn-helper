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

const DELETER_RE = /(^.*deleter).*;/gm;
const EVENTHANDLER_RE = /(\[([^\]]*)\])?(\sreadonly)?\sattribute\sEventHandler\s(\w+)/g;
const GETTER_RE = /\[([^\]]*)\]\s(\w+)\s(\w+)\s?\(([^\)]*)\)/g;
const ITERABLE_RE = /iterable\<[^\>]*>/g;
const MAPLIKE_RE = /maplike\<[^\>]*>/g;
const METHOD_RE = /\[([^\]]*)\]\s(\w+)\s(\w+)\(\)/g;
const PROPERTY_RE = /(\[([^\]]*)\])?(\sreadonly)?\sattribute\s(\w+)\s(\w+)/g;
const CONSTRUCTOR_RE = /constructor\(([^)]*)\)/g;

const DELETER_NAME_RE = /void([^(]*)\(/;
const EVENT_NAME_RE = /EventHandler\s([^;]*)/;
const DELETER_UNNAMED = '';
// const EVENT_NAME_RE

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
    this._deleters = null;
    this._eventHandlers = null;
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

  get methods() {
    // Be sure to exclude EventHandlers, getters(?), setters(?)
  }

  get name() {
    if (!this._name) {
      let matches = this._sourceData.match(INTERFACE_NAME_RE);
      this._name = matches[1];
    }
    return this._name;
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