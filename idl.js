'use strict';

const bcd = require('mdn-browser-compat-data');
const { FlagStatus } = require('./flags.js');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

const EMPTY_BURN_DATA = Object.freeze({
  key: null,
  bcd: null,
  flag: null,
  mdn_exists: null,
  mdn_url: null,
  redirect: false
});

const EMPTY_BCD_DATA = Object.freeze({
  key: null,
  browsers: []
})

class IDLError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class IDLNotSupportedError extends IDLError {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

//TODO: Retrieval of data should depend on whether it is flagged.

class InterfaceData {
  constructor(sourceFile) {
    this._flags = FlagStatus;
    this._loadTree(sourceFile);
    this._sortTree();
  }

  _sortTree() {
    switch (this._type) {
      case 'dictionary':
        this._sortFields();
        break;
      case 'interface':
        this._loadExtras();
        this._sortMembers();
        this._sortMethods();
        this._sortProperties();
        break;
    }

  }

  _sortMethods() {
    this._deleter;
    this._getters = new Map();
    this._setters = new Map();
    this._stringifier;
    for (let m of this._methods) {
      if (m[1].deleter) {
        this._deleter = m;
        this._methods.delete(m[0]);
      }
      if (m[1].getter) {
        this._getters.set(m[0], m[1]);
        this._methods.delete(m[0]);
      }
      if (m[1].setter) {
        this._setters.set(m[0], m[1]);
        this._methods.delete(m[0]);
      }
      if (m[1].stringifier) {
        this._stringifier = m;
        this._methods.delete(m[0]);
      }
    }
  }

  _sortProperties() {
    this._eventhandlers = new Map();
    this._getters = new Map();
    this._setters = new Map();
    for (let p of this._properties) {
      // Sort based on return type.
      switch (p[1].idlType.baseName) {
        case 'EventHandler':
          this._eventhandlers.set(p[0], p[1]);
          this._properties.delete(p[0]);
          break;
        default:
          // Leave it where it is
      }
    }
  }

  _sortFields() {
    this._fields = new Map();
    let ms = this._sourceContents.members;
    for (let f in ms) {
      this._fields.set(ms[f].escapedName, ms[f].default.value);
    }
  }

  _sortMembers() {
    this._consts = new Map();
    this._iterable;
    this._maplike;
    this._methods = new Map();
    this._properties = new Map();
    this._setlike;
    for (let m of this._sourceData.members) {
      m.flag = this._attachFlag(m);
      switch (m.type) {
        case 'attribute':
          this._properties.set(m.escapedName, m);
          break;
        case 'const':
          this._consts.set(m.name, m);
          break;
        case 'iterable':
          this._iterable = m;
          break;
        case 'maplike':
          this._maplike = m;
          break;
        case 'operation':
          this._methods.set(this._getOperationKey(m), m);
          break;
        case 'setlike':
          this._setlike = m;
          break;
        default:
          throw new Error(`Unknown member type found in InterfaceData._sortTree(): ${m.type}.`)
      }
    }
  }

  _attachFlag(member) {
    if (!member.extAttrs) {
      member.flag = null;
      return;
    }
    let flag = member.extAttrs.items.find(attr => {
      return attr.name === 'RuntimeEnabled';
    });
//     member.flag = flag.rhs.value;
    if (flag) {
      member.flag = flag.rhs.value;
    } else {
      member.flag = null;
    }
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

  _loadTree(sourceFile) {
    this._sourceContents = utils.getIDLFile(sourceFile.path());
    let tree = webidl2.parse(this.sourceContents);
    for (let t in tree) {
      switch (tree[t].type) {
        case 'dictionary':
          // STEP1: load source dictionary to _sourceData
          this._sourceData = tree[t];
          this._type = tree[t].type;
          break;
        case 'interface':
          this._sourceData = tree[t];
          this._type = tree[t].type;
          break;
        case 'typedef':
          const msg = `The ${sourceFile.path()} is of type ${tree[t].type} and not currently processible.`
          throw new IDLNotSupportedError(msg);
      }
    }
    if (!this._sourceData) {
      const msg = `The ${sourceFile.path()} file does not contain interface data.`;
      throw new IDLError(msg);
    }
  }

  _loadExtras() {
    if (!this._sourceData.extAttrs) { return; }
    let items = this._sourceData.extAttrs.items;
    this._signatures = [];
    for (let i in items) {
      switch (items[i].name) {
        case 'Constructor':
          this._constructor = true;
          if (items[i].signature) {
            this._signatures.push(items[i].signature.arguments);
          }
          break;
        case 'Exposed':
          this._exposed = new Array();
          if (items[i].rhs) {
            this._exposed.push(items[i].rhs.value);
          } else {
            this._exposed = [...items[i].signature.arguments];
          }
          break;
        case 'OriginTrialEnabled':
          this._originTrial = items[i].rhs.value;
          break;
        case 'RaisesException':
          this._raisesException = true;
          this._exceptions = items[i].rhs.value;
          break;
        case 'RuntimeEnabled':
          this._flag = this._flags[items[i].rhs.value];
          break;
        case 'SecureContext':
          //
          break;
      }
    }
  }

  _getArgumentString(args) {
    let argString = '';
    if (args.length) {
      for (let a in args) {
        argString += (args[a].idlType.baseName + " " + args[a].name + ", ");
      }
      argString = argString.slice(0, -1); // Chop last comma.
    }
    return argString;
  }

  getBurnRecords(options) {
      let keys = this.keys;
      let records = [];
      for (let k of keys) {


      }
  }

  getBurnRecords_(includeFlags=false, includeOriginTrials=false) {
    if (!includeFlags && this.flag) { return; }
    if (!includeOriginTrials && this.originTrial) { return; }
    let keys = this.keys;
    let records = [];
    for (let k in keys) {
      let flagged = this.getMemberFlag(keys[k]) || this.flag;
      // console.log(flagged);
      if (!includeFlags && flagged) { continue; }
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.flag = flagged;
      record.key = keys[k];
      let tokens = keys[k].split('.');
      let data = bcd.api[tokens[0]];
      if (data && tokens.length > 1) {
        data = bcd.api[tokens[0]][tokens[1]];
      }
      if (!data) {
        record.bcd = false;
        record.mdn_exists = false;
        record.mdn_url = '';
      } else {
        record.bcd = true;
        if (data.__compat) {
          record.mdn_url = data.__compat.mdn_url;
        } else {
          record.mdn_exists = false;
          record.mdn_url = '';
        }
      }
      records.push(record);
    }
    return records;
  }

  get command() {
    // Need to deal with setlike and stringifier.
    let command = [];
    command.push('0');
    command.push('1');
    command.push('interface');
    command.push('-n');
    command.push(this.name);
    command.push('-l');
    command.push('-r');
    if (this.hasConstructor()) { command.push('-c'); }
    if (this._iterable) { command.push('-it'); }
    if (this._maplike) { command.push('-mp'); }
    for (let [k, v] of this._eventhandlers) {
      command.push('-h');
      command.push(k);
    }
    for (let [k, v] of this._methods) {
      command.push('-m');
      command.push(k);
    }
    for (let [k, v] of this._properties) {
      command.push('-p');
      command.push(k);
    }
    return command;
  }

  get constants() {
    return this._consts;
  }

  get deleter() {
    return this._deleter;
  }

  get eventhandlers() {
    return this._eventhandlers;
  }

  get flag() {
    return this._flag;
  }

  get flagged() {
    if (this._flag === 'stable') {
      return false;
    } else {
      return true;
    }
  }

  getMemberFlag(key) {
    switch (this.getMemberFlagType(key)) {
      case 'stable':
      case undefined:
        return false;
        break;
      default:
        return true;
    }
  }

  getMemberFlagType(key) {
    if (!key.includes('.')) { return this.flagType; }
    const member = this._sourceData.members.find(member=>{
      return member.name === key;
    });
    if (!member) { return undefined; }
    const flagged = member.extAttrs.find(attr=>{
      return attr === 'RuntimeEnabled';
    });
    const flagName = flagged.rhs.value;
    return this._flags[flagName];
  }

  get getters() {
    return this._getters;
  }

  get iterable() {
    return this._iterable;
  }

  get interfaces() {
    return this._getIdentifiers('.', 'interface');
  }

  get keys() {
    return this._getIdentifiers('.');
  }

  get maplike() {
    return this._maplike;
  }

  get members() {
    // let members = new Map([this._consts, this._eventhandlers, this._getters, this._methods, this._properties, this._setters]);
    // return members;
    let members = new Map();
    for (let [k, v] of this._consts) {
      members.set(k, v);
    }
    if (this._deleter) {
      members.set('deleter', this._deleter);
    }
    for (let [k, v] of this._eventhandlers) {
      members.set(k, v);
    }
    for (let [k, v] of this._getters) {
      members.set(k, v);
    }
    if (this._iterable) {
      members.set('iterable', this._iterable);
    }
    if (this._maplike) {
      members.set('maplike', this._mapline);
    }
    for (let [k, v] of this._methods) {
      members.set(k, v);
    }
    for (let [k, v] of this._properties) {
      members.set(k, v);
    }
    if (this._setlike) {
      members.set('setlike', this._setlike);
    }
    if (this._stringifier) {
      members.set('stringifier', this._stringifier);
    }
    return members;
  }

  get methods() {
    return this._methods;
  }

  get name() {
    return this._sourceData.name;
  }

  get originTrial() {
    return this._originTrial;
  }

  get properties() {
    return this._properties;
  }

  get secureContext() {
    const items = this._sourceData.extAttrs.items;
    return items.some(item=>{
      return item.name === 'SecureContext';
    });
  }

  get setlike() {
    return this._setlike;
  }

  get signatures() {
    // Constructor signatures.
    return this._signatures;
  }

  get sourceContents() {
    return this._sourceContents;
  }

  get stringifier() {
    return this._stringifier;
  }

  get tree() {
    return this._tree;
  }

  get type() {
    return this._type;
  }

  get urls() {
    return this._getIdentifiers('/');
  }

  _getIdentifiers(separator, type='name') {
    // The type argument should be 'name' or 'interface'.
    let identifiers = [];
    identifiers.push(this.name);
    if (this.hasConstructor()) {
      let idBase = this.name + separator + this.name;
      if (type == 'interface') {
        for (let s in this._signatures) {
          let sig = idBase + "(" + this._signatures[s] + ")";
          identifiers.push(sig);
        }
      } else {
        identifiers.push(idBase);
      }
    }
    for (let e of this._eventhandlers.keys()) {
      identifiers.push(this.name + separator + e);
    }
    for (let g of this._getters.keys()) {
      identifiers.push(this.name + separator + g);
    }
    for (let m of this._methods.keys()) {
      identifiers.push(this.name + separator + m);
    }
    for (let p of this._properties.keys()) {
      identifiers.push(this.name + separator + p);
    }
    for (let s of this._setters.keys()) {
      identifiers.push(this.name + separator + s);
    }
    return identifiers;
  }

  hasConstructor() {
    return this._constructor;
  }
}

module.exports.EMPTY_BCD_DATA = EMPTY_BCD_DATA;
module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.InterfaceData = InterfaceData;
