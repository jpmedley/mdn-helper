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

const webidl2 = require('webidl2');

const { Pinger } = require("./pinger.js");
const utils = require('./utils.js');

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
const EXPOSED_RE = /Exposed=?([^\n]*)/;
const EXTENDED_ATTRIBUTES_INTERFACE_RE = /\[(([^\]]*))\]\sinterface/gm;
const EXTENDED_ATTRIBUTES_RE = /\[\W*([^\]]*)\]/;
const INSIDE_PARENS_RE = /\(([^\)]*)\)/;
const INTERFACE_INHERITANCE_RE = /interface\s([^{]+){/;
const RUNTIMEENABLED_RE = /RuntimeEnabled=([^\b]*)\b/;

const CONSTRUCTOR = Object.freeze({
  "arguments": [],
  "flagged": null,
  "originTrial": null,
  "source": null
});

const DELETER = Object.freeze({
  "arguments": [],
  "flagged": null,
  "name": null,
  "originTrial": null,
  "source": null
})

const EVENT_HANDLER = Object.freeze({
  "flagged": null,
  "name": null,
  "originTrial": null,
  "source": null
});

const GETTER = Object.freeze({
  "arguments": [],
  "flagged": null,
  "originTrial": null,
  "returnType": null,
  "source": null
});

const ITERABLE = Object.freeze({
  "arguments": [],
  "flagged": null,
  "originTrial": null,
  "source": null
});

const METHOD = Object.freeze({
  "arguments": [],
  "flagged": null,
  "name": null,
  "originTrial": null,
  "returnType": null,
  "resolution": null,
  "source": null
});

const PROPERTY = Object.freeze({
  "flagged": null,
  "name": null,
  "originTrial": null,
  "readOnly": false,
  "returnType": null,
  "source": null
});

const SETTER = Object.freeze({
  "arguments": [],
  "flagged": null,
  "originTrial": null,
  "source": null
});

class IDLData {
  constructor(sourcePath, options = {}) {
    this._sourceData = this._loadSource(sourcePath);
    this._name;
  }

  _loadSource(sourcePath) {
    let sourceContents = utils.getIDLFile(sourcePath);
    let sourceTree;
    try {
      // Use webidl2 only for crude validation.
      sourceTree = webidl2.parse(sourceContents);
    } catch(e) {
      // if (e instanceof SyntaxError) {
      //   global.__logger.info(`Unable to parse ${sourcePath}.`);
      // }
      global.__logger.error(e.message);
      throw e;
    } finally {
      sourceTree = null;
    }
    return sourceContents;
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
    this._members = [];
    this._type = "interface";
    this._constructors = [];
    this._deleters = [];
    this._eventHandlers = [];
    this._exposed = null;
    this._extendedAttributes = null;
    this._flagged = null;
    this._getters = [];
    this._hasConstructor = null;
    this._iterable = [];
    this._maplike = [];
    this._methods = null;
    this._originTrial = null;
    this._parentClass = null;
    this._properties = [];
    this._setters = [];
    this._processSource();
  }

  _filter(find) {
    return this._members.filter(member => {
      return member.includes(find);
    });
  }

  // [RuntimeEnabled=RTEExperimental] setter void (DOMString property, [TreatNullAs=EmptyString] DOMString propertyValue);
  _processSource() {
    let recording = false;
    const lines = this._sourceData.split('\n');
    let members = [];
    for (let l of lines) {
      if (l.includes('}')) { recording = false; }
      if (recording) {
        if (l.trim() == "") { continue; }
        if (l.startsWith("//")) { continue; }
        members.push(l);
      }
      if (l.includes('interface')) { recording = true; }
    }
    // Take it apart and put it back together so that inline extended attributes
    // are actually inline with the members they support.
    let temp = members.join(" ");
    this._members = temp.split(";");
    const end = this._members.length - 1;
    if (this._members[end] == "") { this._members.pop(); }

    this._getConstructors();
    this._getDeleters();
    this._getEventHandlers();
    this._getGetters();
    this._getIterables();
    this._getMaplikeMethods();
    this._getMethods();
    this._getProperties();
    this._getSetters();
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
    if (source.startsWith("[")) { source = source.slice(1); }
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

  _cloneObject(parent) {
    let newObject = JSON.parse(JSON.stringify(parent))
    newObject.flagged = this.flagged;
    newObject.originTrial = this.originTrial;
    return newObject;
  }

  _getConstructors() {
    const sources = this._filter('constructor');
    sources.forEach(source => {
      let newConstructorData = this._cloneObject(CONSTRUCTOR);
      newConstructorData.source = source.trim();

      let workingString = newConstructorData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newConstructorData);
        workingString = pieces[1];
      }

      let pieces = workingString.split("constructor");
      if (!pieces[1].includes("()")) {
        workingString = pieces[1].trim();
        workingString = workingString.slice(0, -1).slice(1); //Remove parens and ';'
        newConstructorData.arguments = workingString.split(",");
        newConstructorData.arguments.forEach((arg, i, args) => {
          args[i] = arg.trim();
        });
      }
      this._constructors.push(JSON.parse(JSON.stringify(newConstructorData)));
    });
  }

  get constructors() {
    return this._constructors;
  }

  _getDeleters() {
    const sources = this._filter('deleter');
    sources.forEach(source => {
      let newDeleterData = this._cloneObject(DELETER);
      newDeleterData.source = source.trim();

      let workingString = newDeleterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newDeleterData);
        workingString = pieces[1];
      }

      let pieces = workingString.split("(");
      let sigs = pieces[0].split(" "); // pieces of the signature
      if (sigs[2]) { newDeleterData.name = sigs[2]; }
      if (!pieces[1].includes("()")) {
        workingString = pieces[1].trim();
        workingString = workingString.slice(0, -1).slice(1); //Remove parens and ';'
        newDeleterData.arguments = workingString.split(",");
        newDeleterData.arguments.forEach((arg, i, args) => {
          args[i] = arg.trim();
        });
      }
      this._deleters.push(JSON.parse(JSON.stringify(newDeleterData)));
    });
  }

  get deleters() {
    return this._deleters;
  }

  _getEventHandlers() {
    const sources = this._filter('EventHandler');
    sources.forEach(source => {
      let newEventHandler = this._cloneObject(EVENT_HANDLER);
      newEventHandler.source = source.trim();
      
      let workingString = newEventHandler.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newEventHandler);
        workingString = pieces[1];
      }
      
      let pieces = workingString.split(" ");
      newEventHandler.name = pieces[2].trim();
      this._eventHandlers.push(JSON.parse(JSON.stringify(newEventHandler)));
    });
  }

  get eventHandlers() {
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

  _getGetters() {
    const sources = this._filter('getter');
    sources.forEach(source => {
      let newGetterData = this._cloneObject(GETTER);
      newGetterData.source = source.trim();

      let workingString = newGetterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newGetterData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split("(");
      let argsString = pieces[1];
      argsString = argsString.slice(0, -1);
      let args = argsString.split(",");
      args.forEach((arg, i, args) => {
        args[i] = arg.trim();
        if (arg!="") { newGetterData.arguments.push(arg); }
      });

      workingString = pieces[0];
      pieces = workingString.split(" ");
      newGetterData.returnType = pieces[1];
      if (pieces[2]) { newGetterData.name = pieces[2]; }
      this._getters.push(JSON.parse(JSON.stringify(newGetterData)));
    });
  }

  get getters() {
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

  _getIterables() {
    const sources = this._filter('iterable');
    if (sources.length === 0) { return; }
    let newIterable = this._cloneObject(ITERABLE);
    newIterable.source = sources[0].trim();

    let workingString = newIterable.source;
    if (workingString.includes("]")) {
      let pieces = workingString.split("]");
      this._getInlineExtendedAttributes(pieces[0], newIterable);
      workingString = pieces[1];
    }

    let pieces = workingString.split("iterable");
    workingString = pieces[1].trim();
    workingString = workingString.slice(0, -1).slice(1); //Remove brackets and ';'
    if (!workingString.includes(",")) {
      newIterable.arguments.push(workingString)
    } else {
      let args = workingString.split(",");
      newIterable.arguments.push(...args);
    }
    newIterable.arguments.forEach((arg, i, args) => {
      args[i] = arg.trim();
    })
    this._iterable.push(newIterable);
  }

  get iterable() {
    return this._iterable;
  }

  _getMaplikeMethods() {
    const sources = this._filter('maplike');
    if (sources.length === 0) { return; }
    let extendedAttribs;
    if (sources[0].includes("]")) { 
      let pieces = sources[0].split("]");
      extendedAttribs = pieces[0].trim();
    }

    let mlMethods = ["entries", "forEach", "get", "has", "keys", "size", "values"];
    let mlReturns = ["sequence", "void", "", "boolean", "sequence", "long long", "sequence"];
    if (!sources[0].includes("readonly")) {
      mlMethods.push(...["clear", "delete", "set"]);
      mlReturns.push(...["void", "void", "void"]);
    }

    mlMethods.forEach((method, i) => {
      let newMethod = this._cloneObject(METHOD);
      newMethod.name = method;
      newMethod.returnType = mlReturns[i];
      this._getInlineExtendedAttributes(extendedAttribs, newMethod);
      newMethod.source = sources[0].trim();
      this._maplike.push(newMethod);
    });
    
  }

  get maplikeMethods() {
    return this._maplike;
  }

  _getMethods() {
    const nonMethods = ['attribute', 'constructor', 'deleter', 'EventHandler', 'getter', 'iterable', 'maplike', 'setter'];
    let sources = [];
    this._members.forEach((elem, i, elems) => {
      const found = nonMethods.some((nonMethod, i, nonMethods) => {
        return elem.includes(nonMethod);
      });
      if (!found) {
        if (!this._methods) { this._methods = []; }
        sources.push(elem);
      }
    });
    if (sources.length === 0) { return; }

    sources.forEach(source => {
      let newMethodData = this._cloneObject(METHOD);
      newMethodData.source = source.trim();

      let workingString = newMethodData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newMethodData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split("(");
      let argString = pieces[1].slice(0, -1);
      let args = argString.split(",");
      args.forEach((arg, i, args) => {
        args[i] = arg.trim();
        if (arg != "") { newMethodData.arguments.push(arg); }
      });

      let sigs = pieces[0].split(" ");
      newMethodData.name = sigs[1].trim();
      if (sigs[0].includes("Promise")) {
        newMethodData.returnType = "Promise";
        let resolution = sigs[0].split("Promise");
        newMethodData.resolution = resolution[1].slice(0, -1).slice(1);
      } else {
        newMethodData.returnType = sigs[0].trim();
      }
      
      this._methods.push(JSON.parse(JSON.stringify(newMethodData)));
    });
  }

  get methods() {
    return this._methods
  }

  get name() {
    if (this._name) { return this._name; }
    let matches = this._sourceData.match(INTERFACE_NAME_RE);
    this._name = matches[1];
    return this._name;
  }

  get namedGetters() {
    return this._getters.filter(getter => {
      if (!getter.name) { return false; }
      return getter.name != "";
    });
  }

  get namedSetters() {
    return this._setters.filter(setter => {
      if (!setter.name) { return false; }
      return setter.name != "";
    })
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

  _getProperties() {
    const sources = this._filter('attribute');
    sources.forEach(source => {
      if (source.includes('EventHandler')) { return; }
      let newPropertyData = this._cloneObject(PROPERTY);
      newPropertyData.source = source.trim();

      let workingString = newPropertyData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newPropertyData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split(" ")
      pieces = pieces.reverse();
      newPropertyData.name = pieces[0];
      newPropertyData.returnType = pieces[1];
      if (pieces[3]) { newPropertyData.readOnly = true; }

      this._properties.push(newPropertyData);
    });
  }

  get properties() {
    return this._properties;
  }

  get readOnlyProperties() {
    return this._properties.filter(prop => {
      return prop.readOnly === true;
    });
  }

  get readWriteProperties() {
    return this._properties.filter(prop => {
      return prop.readOnly === false;
    });
  }

  get secureContext() {
    let extAttributes = this._getInterfaceExtendedAttributes();
    return extAttributes.includes("SecureContext");
  }

  _getSetters() {
    const sources = this._filter('setter');
    sources.forEach(source => {
      let newSetterData = this._cloneObject(SETTER);
      newSetterData.source = source.trim();

      let workingString = newSetterData.source;
      if (workingString.includes("]")) {
        let pieces = workingString.split("]");
        this._getInlineExtendedAttributes(pieces[0], newSetterData);
        workingString = pieces[1].trim();
      }

      let pieces = workingString.split("(");
      let argString = pieces[1];
      argString = argString.slice(0, -1);
      let args = argString.split(",");
      args.forEach((arg, i, args) => {
        args[i] = arg.trim();
        if (arg != "") { newSetterData.arguments.push(arg);}
      });

      workingString = pieces[0];
      pieces = workingString.split(" ");
      newSetterData.returnType = pieces[1];
      if (pieces[2]) { newSetterData.name = pieces[2]; } 

      this._setters.push(JSON.parse(JSON.stringify(newSetterData)));
    });
  }

  get setters() {
    return this._setters;
  }

  get signatures() {
    // Needed for backward comapatibility.
    let signatures = [];
    let constrs = this.constructors;
    constrs.forEach(elem => {
      let args = elem.arguments.join(", ");
      signatures.push(`constructor(${args})`);
    });
    return signatures;
  }

  get unnamedGetter() {
    return this._getters.filter(getter => {
      if (getter.name) { return false; }
      return new Boolean(getter.name);
    });
  }

  get unnamedSetter() {
    return this._setters.filter(setter => {
      if (setter.name) { return false; }
      return new Boolean(setter.name);
    });
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