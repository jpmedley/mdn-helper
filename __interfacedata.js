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


const CONSTRUCTOR_RE = /constructor\(([^;]*)/g;
const CONSTRUCTOR_ARGS_RE = /\(([^\n]*)/;
const DELETER_RE = /(^.*deleter).*;/gm;
const DELETER_NAME_RE = /void([^(]*)\(/;
const EVENTHANDLER_RE = /(\[([^\]]*)\])?(\sreadonly)?\sattribute\sEventHandler\s(\w+)/g;
const EVENT_NAME_RE = /EventHandler\s([^;]*)/;
const EXPOSED_RE = /Exposed=?([^\n]*)/;
const EXTENDED_ATTRIBUTES_INTERFACE_RE = /\[(([^\]]*))\]\sinterface/gm;
const EXTENDED_ATTRIBUTES_RE = /\[\W*([^\]]*)\]/;
const GETTERS_RE = /getter([^(]+)\(/g;
const GETTER_UNAMED_RE = /getter(\s([^\s]+))\s\(/;
const INSIDE_PARENS_RE = /\(([^\)]*)\)/;
const ITERABLE_RE = /iterable\<[^\>]*>/g;
const INTERFACE_INHERITANCE_RE = /interface\s([^{]+){/;
const MAPLIKE_RE = /(readonly)?\smaplike\<[^\>]*>/g;
const METHOD_PROMISE_RE = /\[([^\]]*)\]\sPromise<([^>]*)>{1,2}\s(\w+)\(([^\)]*)/g; // Name at index 3
const METHOD_RE = /\[([^\]]*)\]\s(\w+)\s(\w+)\(([^\)]*)/g; // Name at index 3
const PROPERTY_READONLY_RE = /(\[([^\]]*)\])?(\sreadonly)\sattribute\s(\w+)\s(\w+)/g;
const PROPERTY_READWRITE_RE = /(\[([^\]]*)\])?[^(\sreadonly)]\sattribute\s(\w+)\s(\w+)/g;
const RUNTIMEENABLED_RE = /RuntimeEnabled=([^\b]*)\b/;
const SETTERS_RE = /setter([^(]+)\(/g;
const SETTER_UNAMED_RE = /setter\svoid\s\(/;

const CONSTRUCTOR = Object.freeze({
  "arguments": [],
  "flagged": null,
  "originTrial": null,
  "source": null
});

const DELETER = Object.freeze({
  "flagged": null,
  "name": null,
  "originTrial": null
})

const EVENT_HANDLER = Object.freeze({
  "flagged": null,
  "name": null,
  "originTrial": null
});

const GETTER = Object.freeze({
  "flagged": null,
  "exists": null,
  "originTrial": null
});

const ITERABLE = Object.freeze({
  "flagged": null,
  "exists": null,
  "originTrial": null
});

const METHOD = Object.freeze({
  "arguments": [],
  "flagged": null,
  "name": null,
  "originTrial": null,
  "returnType": null,
  "resolutions": null
});

const PROPERTY = Object.freeze({
  "flagged": null,
  "name": null,
  "originTrial": null,
  "readOnly": null,
  "returnType": null
});

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
    this._exposed = null;
    this._extendedAttributes = null;
    this._flagged = null;
    this._getter = null;
    this._hasConstructor = null;
    this._interable = null;
    this._maplike = null;
    this._methods = null;
    this._originTrial = null;
    this._parentClass = null;
    this._readOnlyProperties = null;
    this._readWriteProperties = null;
    this._setter = null;
  }

  _getFlagValue(expectedStatus) {
    let extAttributes = this._getInterfaceExtendedAttributes();
    if (extAttributes) {
      let matches = extAttributes.match(RUNTIMEENABLED_RE);
      if (matches) {
        let flag = matches[1];
        let status = global.__Flags.getHighestResolvedStatus(flag);
        return (status == expectedStatus);
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  _getInterfaceExtendedAttributes() {
    if (this._extendedAttributes) { return this._extendedAttributes; }
    let matches = this._sourceData.match(EXTENDED_ATTRIBUTES_INTERFACE_RE);
    if (matches) {
      let match = matches[0];
      let attributes = match.match(EXTENDED_ATTRIBUTES_RE);
      this._extendedAttributes = attributes[0];
    }
    return this._extendedAttributes;
  }

  get constructors() {
    if (this._constructors) { return this._constructors; }
    let matches = this._sourceData.match(CONSTRUCTOR_RE);
    if (matches) {
      this._constructors = [];
      matches.forEach(elem => {
        let constructor_ = Object.assign({}, CONSTRUCTOR);
        constructor_.source = elem;
        constructor_.flagged = this.flagged;
        constructor_.originTrial = this.originTrial;
        let constructorString = elem.match(CONSTRUCTOR_ARGS_RE);
        if (constructorString) {
          if (!constructorString.input.includes("()")) {
            constructor_.arguments = constructorString[1].split(',');
            for (let i = 0; i < constructor_.arguments.length; i++) {
              constructor_.arguments[i] = constructor_.arguments[i].trim();
            }
          }
        }
        this._constructors.push(constructor_);
      });
    }
    return this._constructors;
  }

  get deleters() {
    if (this._deleters) { return this._deleters; }
    let matches = this._sourceData.match(DELETER_RE);
    if (matches) {
      this._deleters = [];
      matches.forEach(elem => {
        let deleters = elem.match(DELETER_NAME_RE);
        let deleter = Object.assign({}, DELETER);
        deleter.name = deleters[1].trim();
        deleter.flagged = this.flagged;
        deleter.originTrial = this.originTrial;
        let found = this._deleters.some(elem => {
          return elem.name == deleter.name;
        });
        if (!found) { this._deleters.push(deleter); }
      });
    }
    return this._deleters;
  }

  get eventHandlers() {
    if (this._eventHandlers) { return this._eventHandlers; }
    let matches = this._sourceData.match(EVENTHANDLER_RE);
    if (matches) {
      this._eventHandlers = [];
      matches.forEach(elem => {
        let eventHandler = Object.assign({}, EVENT_HANDLER);
        let eventHandlers = elem.match(EVENT_NAME_RE);
        eventHandler.name = eventHandlers[1].trim();
        eventHandler.flagged = this.flagged;
        eventHandler.originTrial = this.originTrial;
        let found = this._eventHandlers.some(elem => {
          return elem.name == eventHandler.name;
        });
        if (!found) { this._eventHandlers.push(eventHandler); }
      });
    }
    return this._eventHandlers;
  }

  get exposed() {
    if (this._exposed) { return this._exposed; }
    let extAttributes = this._getInterfaceExtendedAttributes();
    if (extAttributes) {
      let matches = extAttributes.match(EXPOSED_RE);
      if (matches) {
        let match = matches[0];
        if (match.includes("=")) {
          match = match.split('=')[1];
        }
        if (match.includes("(")) {
          let subMatches = match.match(INSIDE_PARENS_RE);
          match = subMatches[1];
        }
        if (match.endsWith(",")) { match = match.substring(0, match.length-1) }
        this._exposed = match.split(',');
      }
    }
    return this._exposed;
  }

  get flagged() {
    if (this._flagged) { return this._flagged}
    this._flagged = this._getFlagValue("experimental");
    return this._flagged;
  }

  get getter() {
    if (this._getter) { return this._getter; }
    let getterObj = Object.assign({}, GETTER);
    let matches = this._sourceData.match(GETTERS_RE);
    if (matches) {
      const getter = matches.find(elem => {
        return elem.match(GETTER_UNAMED_RE);
      });
      if (getter) {
        getterObj.exists = true;
        getterObj.flagged = this.flagged;
        getterObj.originTrial = this.originTrial
      } else {
        getterObj.exists = false;
      }
    } else {
      getterObj.exists = false;
    }
    this._getter = getterObj;
    return this._getter
  }

  get hasConstructor() {
    if (this._hasConstructor) { return this._hasConstructor; }
    let matches = this._sourceData.match(CONSTRUCTOR_RE);
    if (matches) {
      this._hasConstructor = true;
    } else {
      this._hasConstructor = false;
    }
    return this._hasConstructor;
  }

  get iterable() {
    if (this._iterable) { this._iterable; }
    let iterableObj = Object.assign({}, ITERABLE);
    let matches = this._sourceData.match(ITERABLE_RE);
    if (matches) {
      iterableObj.exists = true;
      iterableObj.flagged = this.flagged;
      iterableObj.originTrial = this.originTrial;
    } else {
      iterableObj.exists = false;
    }
    this._iterable = iterableObj;
    return this._iterable;
  }

  get maplikeMethods() {
    if (this._maplike) { return this._maplike; }
    let matches = this._sourceData.match(MAPLIKE_RE);
    if (matches) {
      this._maplike = [];
      let mlMethods = ["entries", "forEach", "get", "has", "keys", "size", "values"];
      let mlReturns = ["sequence", "void", "", "boolean", "sequence", "long long", "sequence"];
      if (!matches[0].includes('readonly')) {
        mlMethods.push(...["clear", "delete", "set"]);
        mlReturns.push(...["void", "void", "void"]);
      }
      mlMethods.forEach((method, index) => {
        let meth = Object.assign({}, METHOD);
        meth.name = `${method}()`;
        meth.flagged = this.flagged;
        meth.originTrial = this.originTrial;
        meth.returnType = mlReturns[index];
        this._maplike.push(meth);
      });
    }
    return this._maplike;
  }

  get methods() {
    if (this._methods) { return this._methods; }
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
    let maplikes = this.maplikeMethods;
    if (maplikes) { this._methods.push(...maplikes); }
    return this._methods
  }

  get name() {
    if (this._name) { return this._name; }
    let matches = this._sourceData.match(INTERFACE_NAME_RE);
    this._name = matches[1];
    return this._name;
  }

  get originTrial() {
    if (this._originTrial) { return this._originTrial}
    this._originTrial = this._getFlagValue("origintrial");
    return this._originTrial;
  }

  get parentClass() {
    if (this._parentClass) { return this._parentClass; }
    let matches = this._sourceData.match(INTERFACE_INHERITANCE_RE);
    if (matches) {
      let names = matches[1].split(":");
      if (names[1]) { this._parentClass = names[1].trim(); }
    }
    return this._parentClass;
  }

  get properties() {
    if (this._allProperties) { return this._allProperties; }
    this._allProperties = [];
    let props = this.readOnlyProperties;
    if (props) { this._allProperties.push(...props); }
    props = this.readWriteProperties;
    if (props) { this._allProperties.push(...props); }
    return this._allProperties;
  }

  get readOnlyProperties() {
    if (this._readOnlyProperties) { return this._readWriteProperties; }
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
    return this._readOnlyProperties;
  }

  get readWriteProperties() {
    if (this._readWriteProperties) { return this._readWriteProperties; }
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
    return this._readWriteProperties;
  }

  get secureContext() {
    let extAttributes = this._getInterfaceExtendedAttributes();
    return extAttributes.includes("SecureContext");
  }

  get setter() {
    if (this._setter) { return this._setter; }
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
    return this._setter
  }

  get signatures() {
    // Needed for backward comapatibility.
    let signatures = [];
    let constrs = this.constructors;
    constrs.forEach(elem => {
      signatures.push(elem.source);
    });
    return signatures;
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