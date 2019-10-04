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

const fs = require('fs');
const { Pinger } = require('./pinger.js');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

const EMPTY_BCD_DATA = Object.freeze({
  key: null,
  browsers: []
});

const EMPTY_BURN_DATA = Object.freeze({
  key: null,
  bcd: false,
  flag: false,
  mdn_exists: false,
  mdn_url: '',
  origin_trial: false,
  redirect: false,
  type: ''
});

const ITERABLE = ['entries', 'forEach', 'keys', 'values'];
const MAPLIKE = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
const READONLY_MAPLIKE = ['entries', 'forEach', 'get', 'has', 'keys', 'size', 'values'];
const SETLIKE = ['entries', 'forEach', 'has', 'keys', 'size', 'values'];
const SYMBOLS = Object.freeze({
  iterable: ITERABLE,
  maplike: MAPLIKE,
  readonlymaplike: READONLY_MAPLIKE,
  setlike: SETLIKE
});

const NO_FLAG = 'No flag found';

//Cross refences webidl2 types with MDN terminology
const TYPES = Object.freeze({
  "attribute": "property",
  "extended-attribute": "constructor",
  "operation": "method",
  "interface": "reference",
});

class IDLError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class IDLAttributeError extends IDLError {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class IDLFlagError extends IDLAttributeError {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class IDLData {
  constructor(sourceTree, options = {}) {
    this._sourcePath = options.sourcePath;
    this._storeTree(sourceTree);
  }

  _storeTree(source) {
    this._sourceData = source;
    this._type = source.type;
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

  get sourcePath() {
    return this._sourcePath;
  }

  set sourcePath(path) {
    this._sourcePath = path;
  }

  get type() {
    return this._type;
  }

  _generateRecord(options) {
    let record = Object.assign({}, EMPTY_BURN_DATA);
    record.key = options.key;
    let bcdData = global._bcd.getByKey(`api.${record.key}`);
    if (bcdData) {
      record.bcd = true;
      if (bcdData.__compat) {
        if (bcdData.__compat.mdn_url) {
          record.mdn_url = bcdData.__compat.mdn_url;
        }
      }
    }
    record.flag = this._isFlagged(options.idlData);
    record.origin_trial = this._isOriginTrial(options.idlData);
    record.type = TYPES[`${options.idlData.type}`];
    return record;
  }

  _getExtendedAttribute(member, attributeName) {
    if (!member.extAttrs) { return null; }
    const attributeValue = member.extAttrs.items.find(attr => {
      return attr.name === attributeName;
    });
    if (!attributeValue) { return null; }
    switch (attributeName) {
      case 'OriginTrialEnabled':
      case 'RuntimeEnabled':
        return attributeValue.rhs.value;
      case 'SecureContext':
        return attributeValue;
      default:
        const msg = `Unhandled extended attribute: ${attributeName}.`;
        throw new IDLAttributeError(msg);
    }
  }

  _getFlagStatus(root) {
    const attribute = this._getExtendedAttribute(root, 'RuntimeEnabled')
    return global.__Flags.getHighestResolvedStatus(attribute);
  }

  // _isBurnable(member, options = {
  //   includeExperimental: this._includeExperimental,
  //   includeOriginTrials: this._includeOriginTrials}) {
  _isBurnable(member, options = {
    includeExperimental: false,
    includeOriginTrials: false }) {
    const status = this._getFlagStatus(member);
    switch (status) {
      case 'test':
        return false;
      case 'experimental':
        return options.includeExperimental;
      case 'origintrial':
        return options.includeOriginTrials;
      case 'stable':
        return true;
      case NO_FLAG:
        return true;
      default:
        throw new IDLFlagError(`Unrecognized status value: ${status}.`);
    }
  }

  _shouldBurn(member) {
    if (!this._isBurnable(member)) { return false; }
    if (member.stringifier) { return false; }
    if (member.deleter) { return false; }
    return true;
  }

  get constants() {
    let returns = this._sourceData.members.filter(m => {
      if (!m.type === 'const') { return false; }
      if (this._isBurnable(m)) { return true; }
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  get flagged() {
    const flag = this._getFlagStatus(this._sourceData);
    switch (flag) {
      case 'experimental':
        return true;
      case 'stable':
        return false;
      case (NO_FLAG):
        return false;
      default:
        return true;
    }
  }

  getFlag(member = this._sourceData) {
    return this._getFlagStatus(member);
  }

  get key() {
    let keys = this.keys;
    return keys[0];
  }

  get keys() {
    return this._getIdentifiers('.');
  }

  getkeys(stableOnly = false) {
    return this._getIdentifiers('.', { stableOnly: stableOnly });
  }

  get name() {
    return this._sourceData.name;
  }

  get originTrial() {
    const flag = this._getFlagStatus(this._sourceData);
    switch (flag) {
      case ('stable'):
        return false;
      case (NO_FLAG):
        return false;
      default:
        return true;
    }
  }

  getSecureContext(member = this._sourceData) {
    if (this._getExtendedAttribute(this._sourceData, 'SecureContext')) {
      return true;
    }
    return false;
  }

  writeKeys(keyFile) {
    const keys = this.getkeys(true);
    const keyList = keys.join('\n');
    fs.appendFileSync(keyFile, keyList);
  }

  getBurnRecords() {
    let records = [];
    // Get an interface record.
    // We wouldn't be here if interface was not burnable.
    let options = {
      idlData: this._sourceData,
      key: this._sourceData.name
    }
    records.push(this._generateRecord(options));
    // Get a constructor record.
    if (this.hasConstructor) {
      if (this._isBurnable(this.constructorBranch)) {
        options.key = `${this._sourceData.name}.${this._sourceData.name}`;
        options.idlData = this.constructorBranch;
        records.push(this._generateRecord(options));
      }
    }
    // Get member records.
    if (this._sourceData.members) {
      this._sourceData.members.forEach(m => {
        if (this._shouldBurn(m)) {
          options.idlData = m;
          let name = this._resolveMemberName(m);
          if (SYMBOLS.hasOwnProperty(name)) {
            SYMBOLS[name].forEach(i => {
              options.key = `${this._sourceData.name}.${i}`;
              records.push(this._generateRecord(options));
            })
          } else if (name === 'what') {
            // Do nothing.
          } else {
            options.key = `${this._sourceData.name}.${name}`;
            records.push(this._generateRecord(options));
          }
        }
      })
    }
    return records;
  }

  _isFlagged(searchRoot) {
    if (this._getExtendedAttribute(searchRoot, 'RuntimeEnabled')) {
      return true;
    }
    return false;
  }

  _isOriginTrial(searchRoot) {
    if (this._getExtendedAttribute(searchRoot, 'OriginTrialEnabled')) {
      return true;
    }
    return false;
  }
}

class CallbackData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
  }

  _getIdentifiers(separator, options = { stableOnly: false }) {
    let identifiers = [];
    identifiers.push(this._sourceData.name);
    return identifiers;
  }
}

class DictionaryData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
  }

  _getIdentifiers(separator, options = { stableOnly: false }) {
    const msg = 'Time to deal with Dictionary.';
    throw new Error(msg);
  }
}

class EnumData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
  }

  _getIdentifiers(separator, options = { stableOnly: false }) {
    let identifiers = [];
    identifiers.push(this._sourceData.name);
    for (let v of this._sourceData.values) {
      identifiers.push(`${this._sourceData.name}${separator}${v.value}`);
    }
    return identifiers;
  }
}

class InterfaceData extends IDLData {
  constructor(source, options = {}) {
    super(source, options);
  }

  _getIdentifiers(separator, options = { stableOnly: false }) {
    let identifiers = [];
    identifiers.push(this.name);
    if (this.hasConstructor) {
      identifiers.push(`${this.name}${separator}${this.name}`);
    }
    this._sourceData.members.map(m => {
      if (options.stableOnly === true) {
        if (!this._isBurnable(m, {includeExperimental: !options.stableOnly})) { return; }
      }
      switch (m.type) {
        case 'attribute':
          identifiers.push(`${this.name}${separator}${m.escapedName}`);
          break;
        case 'const':
          identifiers.push(`${this.name}${separator}${m.name}`);
          break;
        case 'iterable':
          for (let i of ITERABLE) {
            identifiers.push(`${this.name}${separator}${i}`);
          }
          break;
        case 'maplike':
          for (let m of MAPLIKE) {
            identifiers.push(`${this.name}${separator}${m}`);
          }
          break;
        case 'setlike':
          for (let s of SETLIKE) {
            identifiers.push(`${this.name}${separator}${s}`);
          }
          break;
        case 'operation':
          if (!m.getter && !m.setter) {
            let opKey = this._getOperationKey(m);
            identifiers.push(`${this.name}${separator}${opKey}`);
          }
          break;
        default:
          console.log(m.type);
          throw new IDLError(`Unknown member type found in InterfaceData._getIdentifiers: ${m.type}.`)
      }
    });
    return identifiers;
  }

  _getOperationKey(member) {
    if (member.deleter) {
      return 'deleter';
    }
    if (member.getter) {
      return 'getter';
    }
    if (member.setter) {
      return 'setter';
    }
    if (member.stringifier) {
      return 'stringifier';
    }
    if (member.body.name) {
      return member.body.name.escaped;
    }
    throw new Error('Cannot find operation key.');
  }

  _resolveMemberName(member) {
    switch (member.type) {
      case 'operation':
        if (member.getter || member.setter) {
          return member.body.idlType.baseName;
        } else {
          return member.body.name.value;
        }
      case 'attribute':
        return member.name;
      case 'iterable':
        return member.type;
      case 'maplike':
        let type = member.type;
        if (member.readonly) {
          type = `readonly${type}`;
        }
        return type;
      default:
        return 'what';
    }
  }

  get constructorBranch() {
    try {
      return this._sourceData.extAttrs.items.find(i => {
        return i.name === 'Constructor';
      })
    } catch (e) {
      if (e.name === 'TypeError') {
        return null;
      } else {
        throw e;
      }
    }
  }

  get deleter() {
    throw new IDLError('Time to deal with deleaters.');
  }

  get eventHandlers() {
    let returns = this._sourceData.members.filter(m => {
      if (m.baseName === 'EventHandler') {
        return this._isBurnable(m);
      }
      return false;
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  get iterable() {
    return this._sourceData.members.some(m => {
      return m.type === 'iterable';
    });
  }

  get getter() {
    throw new IDLError('Time to deal with getters.')
  }

  get hasConstructor() {
    try {
      return this._sourceData.extAttrs.items.some(i => {
        return i.name === 'Constructor';
      })
    } catch (e) {
      if (e.name === 'TypeError') {
        return false;
      } else {
        throw e;
      }
    }
  }

  get maplike() {
    return this._sourceData.members.some(m => {
      return m.type === 'maplike';
    });
  }

  get members() {
    let members = new Map();
    const properties = this.properties;
    if (properties) {
      for (let p of properties) {
        members.set(p.name, p);
      }
    }
    const methods = this.methods;
    if (methods) {
      for (let m of methods) {
        if (m.body.name) {
          members.set(m.body.name.value, m);
        }
      }
    }
    return members;
  }

  get methods() {
    let returns = this._sourceData.members.filter(item => {
      if (item.getter) { return false; }
      if (item.setter) { return false; }
      return item.type === 'operation';
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  get properties() {
    let returns = this._sourceData.members.filter(item => {
      return item.type === 'attribute';
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  get setters() {
    throw new IDLError('Time to deal with setters.')
  }

  get signatures() {
    try {
      let signatures = [];
      this._sourceData.extAttrs.items.forEach((item, i, items) => {
        if (item.name === 'Constructor') {
          let sigArgs = [];
          item.signature.arguments.forEach((arg, i, args) => {
            sigArgs.push(arg.escapedName);
          });
          const sig = sigArgs.join(', ');
          signatures.push(`(${sig})`);
        }
      });
      return signatures;
    } catch (e) {
      if (e.name === 'TypeError') {
        return null;
      } else {
        throw e;
      }
    }
  }

  get stringifier() {
    throw new IDLError('Time to deal with stringifier.')
  }
}

const TREE_TYPES = Object.freeze({
  callback: CallbackData,
  dictionary: undefined,
  enum: EnumData,
  includes: undefined,
  interface: InterfaceData
});

module.exports.CallbackData = CallbackData;
module.exports.DictionaryData = DictionaryData;
module.exports.EMPTY_BCD_DATA = EMPTY_BCD_DATA;
module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.EnumData = EnumData;
module.exports.IDLFlagError = IDLFlagError;
module.exports.InterfaceData = InterfaceData;
module.exports.TREE_TYPES = TREE_TYPES;
