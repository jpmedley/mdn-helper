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


// const CONSTRUCTOR_RE = /constructor\(([^;]*)/g;
const CONSTRUCTOR_RE = /(\[(([^\]]*))\])?\sconstructor(\([^;]*)/g;
const DELETER_RE = /(\[(([^\]]*))\])?\sdeleter\svoid\s([^(]+)?\(([^)]+)\)/g;
const DELETER_NAME_RE = /void([^(]*)\(/;
const EVENTHANDLER_RE = /(\[([^\]]*)\])?(\sreadonly)?\sattribute\sEventHandler\s(\w+)/g;
const EVENT_NAME_RE = /EventHandler\s([^;]*)/;
const EXPOSED_RE = /Exposed=?([^\n]*)/;
const EXTENDED_ATTRIBUTES_INTERFACE_RE = /\[(([^\]]*))\]\sinterface/gm;
const EXTENDED_ATTRIBUTES_RE = /\[\W*([^\]]*)\]/;
const GETTERS_RE = /(\[(([^\]]*))\])?\sgetter\s([^ ]+)\s([^(]+)?\(([^)]+)\)/g;
const GETTER_UNAMED_RE = /getter(\s([^\s]+))\s\(/;
const INSIDE_PARENS_RE = /\(([^\)]*)\)/;
const ITERABLE_RE = /(\[([^\]]*)\])?\siterable(\<[^\>]*>>?)/g;
const INTERFACE_INHERITANCE_RE = /interface\s([^{]+){/;
const MAPLIKE_RE = /(\[([^\]]*)\])?\s(readonly\s)?maplike(\<[^\>]*>)/g;
const METHOD_PROMISE_RE = /\[([^\]]*)\]\sPromise<([^>]*)>{1,2}\s(\w+)\(([^\)]*)/g; // Name at index 3
const METHOD_RE = /\[([^\]]*)\]\s(\w+)\s(\w+)\(([^\)]*)/g; // Name at index 3

const PROPERTIES = /(\[(\w+=\w+)\])?(\sreadonly)?\sattribute\s(\w+)\s(\w+)/g;
const PROPERTY_READONLY_RE = /(\[(\w+=\w+)\])?(\sreadonly)\sattribute\s(\w+)\s(\w+)/g;
const PROPERTY_READWRITE_RE = /(\[(\w+=\w+)\])?(?!\sreadonly)\sattribute\s(\w+)\s(\w+)/g;


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

const SETTER = Object.freeze({
  "flagged": null,
  "exists": null,
  "originTrial": null
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
    this._getters = null;
    this._hasConstructor = null;
    this._iterable = null;
    this._maplike = null;
    this._methods = null;
    this._originTrial = null;
    this._parentClass = null;
    this._readOnlyProperties = null;
    this._readWriteProperties = null;
    this._setter = null;
  }

  _getRuntimeEnabledValue(expectedStatus, fromAttributes) {
    if (fromAttributes) {
      let matches = fromAttributes.match(RUNTIMEENABLED_RE);
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

  _getRuntimeEnabledValue__(expectedStatus, forFlag) {
    let status = global.__Flags.getHighestResolvedStatus(forFlag);
    return (status === expectedStatus);
  }

  _getInlineExtendedAttributes(source, dataObject) {
    const sources = source.split(",");
    sources.forEach(elem => {
      let elems = elem.split("=");
      switch (elems[0]) {
        case "RuntimeEnabled":
          dataObject.flagged = dataObject.flagged || this._getRuntimeEnabledValue__("experimental", elems[1]);
          dataObject.originTrial = dataObject.originTrial || this._getRuntimeEnabledValue__("origintrial", elems[1]);
          break;
        default:
          break;
      }
    })
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
    let matches = this._sourceData.matchAll(CONSTRUCTOR_RE);
    let match = matches.next();
    if (!match.done) { this._constructors = []; }
    while (!match.done) {
      let constructor_ = Object.assign({}, CONSTRUCTOR);
      constructor_.source = match.value[0];
      constructor_.flagged = this.flagged;
      constructor_.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], constructor_);
      }
      let constructorString = match.value[4];
      if (constructorString) {
        if (!constructorString.includes("()")) {
          constructor_.arguments = constructorString.split(',');
          for (let i = 0; i < constructor_.arguments.length; i++) {
            constructor_.arguments[i] = constructor_.arguments[i].trim();
          }
        }
      }
      this._constructors.push(constructor_);
      match = matches.next();
    }
    return this._constructors;
  }

  get deleters() {
    if (this._deleters) { return this._deleters; }
    let matches = this._sourceData.matchAll(DELETER_RE);
    let match = matches.next();
    if (!match.done) { this._deleters = []; }
    while (!match.done) {
      let deleter = Object.assign({}, DELETER);
      deleter.name = (match.value[4]? match.value[4].trim(): null);
      deleter.flagged = this.flagged;
      deleter.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], deleter);
      }
      let found = this._deleters.some(elem => {
        return elem.name == deleter.name;
      });
      if (!found) { this._deleters.push(deleter); }
      match = matches.next();
    }
    return this._deleters;
  }

  get eventHandlers() {
    if (this._eventHandlers) { return this._eventHandlers; }
    let matches = this._sourceData.matchAll(EVENTHANDLER_RE);
    let match = matches.next();
    if (!match.done) { this._eventHandlers = []; }
    while (!match.done) {
      let eventHandler = Object.assign({}, EVENT_HANDLER);
      eventHandler.name = match.value[4].trim();
      eventHandler.flagged = this.flagged;
      eventHandler.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], eventHandler);
      }
      let found = this._eventHandlers.some(elem => {
        return elem.name == eventHandler.name;
      });
      if (!found) { this._eventHandlers.push(eventHandler); }
      match = matches.next();
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
    this._flagged = this._getRuntimeEnabledValue("experimental", this._getInterfaceExtendedAttributes());
    return this._flagged;
  }

  get getters() {
    if (this._getters) { return this._getters; }
    let matches = this._sourceData.matchAll(GETTERS_RE);
    let match = matches.next();
    if (!match.done) { this._getters = []; }
    while(!match.done) {
      let getter = Object.assign({}, GETTER);
      getter.name = (match.value[5]? match.value[5].trim(): null);
      getter.flagged = this.flagged;
      getter.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], getter);
      }
      let found = this._getters.some(elem => {
        return elem.name == getter.name;
      });
      if (!found) { this._getters.push(getter); }
      match = matches.next();
    }
    return this._getters
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
    let matches = this._sourceData.matchAll(ITERABLE_RE);
    let match = matches.next();
    this._iterable = [];
    while (!match.done) {
      let newIterable = Object.assign({}, ITERABLE);
      this._iterable.push(newIterable);
      this._iterable[0].flagged = this.flagged;
      this._iterable[0].originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], this._iterable[0]);
      }
      match = matches.next();
    }
    return this._iterable;
  }

  get maplikeMethods() {
    if (this._maplike) { return this._maplike; }
    let matches = this._sourceData.matchAll(MAPLIKE_RE);
    let match = matches.next();
    let mlMethods = ["entries", "forEach", "get", "has", "keys", "size", "values"];
    let mlReturns = ["sequence", "void", "", "boolean", "sequence", "long long", "sequence"];
    let tempMaplike;
    if (!match.done) {
      this._maplike = [];
      tempMaplike = Object.assign({}, METHOD);
      tempMaplike.flagged = this.flagged;
      tempMaplike.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], tempMaplike);
      }
      if (!matches[3]) {
        // matches[3] would equal 'readonly'
        mlMethods.push(...["clear", "delete", "set"]);
        mlReturns.push(...["void", "void", "void"]);
      }
    }
    while (!match.done) {
      mlMethods.forEach((method, index) => {
        let meth = Object.assign({}, tempMaplike);
        meth.name = `${method}()`;
        meth.returnType = mlReturns[index];
        this._maplike.push(meth);
      });
      match = matches.next();
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
      method.flagged = this.flagged;
      method.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], method); 
      }
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
      method.flagged = this.flagged;
      method.originTrial = this.originTrial;
      if (match.value[1]) {
        this._getInlineExtendedAttributes(match.value[2], method); 
      }
      method.returnType = "Promise";
      if (match.value[4]) {
        method.arguments = match.value[4].split(',');
      }
      this._methods.push(method);
      match = matches.next();
    }
    let maplikes = this.maplikeMethods;
    if (maplikes) { this._methods.push(...maplikes); }
    let namedGetters = this.namedGetters;
    if (namedGetters) { this._methods.push(...namedGetters); }
    return this._methods
  }

  get name() {
    if (this._name) { return this._name; }
    let matches = this._sourceData.match(INTERFACE_NAME_RE);
    this._name = matches[1];
    return this._name;
  }

  get namedGetters() {
    if (!this._getters) { this.getters; }
    if (this._getters) {
      let namedGetters = this._getters.filter(elem => {
        return (elem.name? true: false);
      });
      return namedGetters;
    }
    return null;
  }

  get originTrial() {
    if (this._originTrial) { return this._originTrial}
    this._originTrial = this._getRuntimeEnabledValue("origintrial", this._getInterfaceExtendedAttributes());
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
    let matches = this._sourceData.matchAll(PROPERTIES);
    let match = matches.next();
    if (!match.done) { this._allProperties = [];}
    while (!match.done) {
      let returnType = match.value[4];
      if (returnType === 'EventHandler') {
        match = matches.next();
        continue;
      }
      let prop = Object.assign({}, PROPERTY);
      prop.name = match.value[5];
      prop.flagged = this.flagged;
      prop.originTrial = this.originTrial;
      prop.readOnly = (match.value[3]? false: true);
      // prop.returnType = match.value[4];
      prop.returnType = (returnType? returnType: 'void');
      this._allProperties.push(prop);
      match = matches.next();
    }
    return this._allProperties;
  }

  get readOnlyProperties() {
    if (this._readOnlyProperties) { return this._readWriteProperties; }
    this._readOnlyProperties = [];
    this._readOnlyProperties = this.properties.filter(prop => {
      return prop.readOnly == true;
    });
    return this._readOnlyProperties;
  }

  get readWriteProperties() {
    if (this._readWriteProperties) { return this._readWriteProperties; }
    this._readWriteProperties = [];
    this._readWriteProperties = this.properties.filter(prop => {
      return prop.readOnly == false;
    });
    return this._readWriteProperties;
  }

  get secureContext() {
    let extAttributes = this._getInterfaceExtendedAttributes();
    return extAttributes.includes("SecureContext");
  }

  get setter() {
    if (this._setter) { return this._setter; }
    let setterObj = Object.assign({}, SETTER);
    let matches = this._sourceData.match(SETTERS_RE);
    if (matches) {
      const setter = matches.find(elem => {
        return elem.match(SETTER_UNAMED_RE);
      });
      if (setter) {
        setterObj.exists = true;
        setterObj.flagged = this.flagged;
        setterObj.originTrial = this.originTrial;
      } else {
        setterObj.exists = false;
      }
    } else {
      setterObj.exists = false;
    }
    this._setter = setterObj;
    return this._setter;
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

  get unnamedGetter() {
    if (!this._getters) { this.getters; }
    if (this._getters) {
      let unnamedGetter = this._getters.filter(elem => {
        return (elem.name? false: true);
      });
      return unnamedGetter;
    }
    return null;
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