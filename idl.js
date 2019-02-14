'use strict';

const bcd = require('mdn-browser-compat-data');
const { FlagStatus } = require('./flags.js');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

const EMPTY_BURN_DATA = Object.freeze({
  key: null,
  bcd: false,
  flag: false,
  mdn_exists: false,
  mdn_url: '',
  origin_trial: false,
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
  }

  _loadTree(sourceFile) {
    this._sourceContents = utils.getIDLFile(sourceFile.path());
    let tree = webidl2.parse(this._sourceContents);
    for (let t of tree) {
      switch (t.type) {
        case 'dictionary':
          this._sourceData = t;
          this._type = t.type;
          break;
        case 'interface':
          this._sourceData = t;
          this._type = t.type;
          break;
        case 'typedef':
          const msg = `The ${sourceFile.path()} is of type ${t.type} and not currently processible.`
          throw new IDLNotSupportedError(msg);
      }
    }
    if (!this._sourceData) {
      const msg = `The ${sourceFile.path()} file does not contain interface data.`;
      throw new IDLError(msg);
    }
  }

  _getFlag(member) {
    if (!member.extAttrs) { return null; }
    const flag = member.extAttrs.items.find(attr => {
      return attr.name === 'RuntimeEnabled';
    });
    if (flag) {
      return flag.rhs.value;
    } else {
      return null;
    }
  }

  _getIdentifiers(separator, type='name') {
    let identifiers = [];
    identifiers.push(this.name);
    if (type === 'interface') {
      if (this.hasConstructor()) {
        let signature = `${this.name}${separator}${this.name}`;
        let signatures = this.signatures.map(sig => {
          return `${signature}(${sig})`;
        });
        identifiers = [identifiers, ...signatures];
      }
    }
    this._sourceData.members.map(m => {
      switch (m.type) {
        case 'attribute':
          identifiers.push(`${this.name}${separator}${m.escapedName}`);
          break;
        case 'const':
          identifiers.push(`${this.name}${separator}${m.name}`);
          break;
        case 'iterable':
        case 'maplike':
        case 'setlike':
          identifiers.push(`${this.name}${separator}${m}`);
          break;
        case 'operation':
          let opKey = this._getOperationKey(m);
          identifiers.push(`${this.name}${separator}${opKey}`);
        default:
          throw new IDLError(`Unknown member type found in InterfaceData._sortTree(): ${m.type}.`)
      }
    })
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

  _getOriginTrial(member) {
    if (!member.extAttrs) { return null; }
    const ot = member.extAttrs.items.find(attr => {
      return attr.name === 'OriginTrialEnabled';
    });
    if (ot) {
      return ot.rhs.value;
    } else {
      return null;
    }
  }

  _isBurnable(member, options) {
    // Temporary implementation.
    return true;
  }

  _isFlagged(member) {
    if (!member.extAttrs) { return false; }
    return member.extAttrs.items.some(attr => {
      return attr.name === 'RuntimeEnabled';
    });
  }

  _isOriginTrial(member) {
    if (!member.extAttrs) { return false; }
    return member.extAttrs.items.some(attr => {
      return attr.name == 'OriginTrialEnabled';
    });
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
    return this._sourceData.members.filter(m => {
      if (!m.type === 'const') { return false; }
      if (this._isBurnable(m)) { return true; }
    })
  }

  get deleter() {
    throw new IDLError('Time to deal with deleaters.')
  }

  get eventHandlers() {
    throw new IDLError('Time to deal with eventHandlers.')
  }

  get getter() {
    throw new IDLError('Time to deal with getters.')
  }

  get interfaces() {
    return this._getIdentifiers(',', 'interface');
  }

  get keys() {
    return this._getIdentifiers('.');
  }

  get methods() {
    return this._sourceData.map(item => {
      return item.type === 'operation';
    });
  }

  get properties() {
    return this._sourceData.map(item => {
      return item.type === 'attribute';
    });
  }

  get setters() {
    throw new IDLError('Time to deal with setters.')
  }

  get signatures() {
    try {
      return this._sourceData.extAttrs.items.map(i => {
        return i.name === 'constructor';
      })
    } catch (e) {
      throw new IDLError('Time to deal with false case in signatures.');
    } finally {

    }
  }

  get stringifier() {
    throw new IDLError('Time to deal with stringifier.')
  }

  get urls() {
    return this._getIdentifiers('/');
  }

  getBurnRecords(options) {
    //START HERE: map() doesn't do what you think. Interface record
    //  needs to be added.
    let records = this._sourceData.members.map(m => {
      if (!this._isBurnable(m, options)) { return; }
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.key = `${this._sourceData.name}.${m.name}`;
      let data = bcd.api[this._sourceData.name][m.name];
      if (data) {
        record.bcd = true;
        record.mdn_url = data.__compat.mdn_url;
        record.flag = this._isFlagged(m);
        record.origin_trial = this._isOriginTrial(m);
      }
      return record;
    });
    // Need to add key for main interface and overview page.
  }

  hasConstructor() {
    try {
      return this._sourceData.extAttrs.items.some(i => {
        return i.name === 'constructor';
      })
    } catch (e) {
      throw new IDLError('Time to deal with false case in hasConstructor().');
    }
  }
}

module.exports.EMPTY_BCD_DATA = EMPTY_BCD_DATA;
module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.InterfaceData = InterfaceData;
