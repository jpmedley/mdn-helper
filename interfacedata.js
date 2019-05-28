'use strict';

const { FlagStatus } = require('./flags.js');
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
const SYMBOLS = Object.freeze({
  iterable: ITERABLE,
  maplike: MAPLIKE,
  readonlymaplike: READONLY_MAPLIKE
});

//Cross refences webidl2 types with MDN terminology
const TYPES = Object.freeze({
  attribute: "property",
  constructor: "constructor",
  operation: "method",
  interface: "reference",
});

class IDLError extends Error {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class IDLFlagError extends IDLError {
  constructor(message='', fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class InterfaceData {
  constructor(sourceFile, options = {}) {
    this._includeExperimental = (options.experimental? options.experimental: false);
    this._includeOriginTrials = (options.originTrial? options.originTrial: false);
    try {
      this._loadTree(sourceFile);
    } catch (error) {
      throw error;
    }
  }

  async ping() {
    let pingRecords = this.getBurnRecords();
    const pinger = new Pinger(pingRecords);
    const verboseOutput = false
    console.log('\nChecking for existing MDN pages. This may take a few minutes.');
    let records = await pinger.pingRecords(verboseOutput)
    .catch(e => {
      throw e;
    });
    return records;
  }

  _loadTree(sourceFile) {
    this._sourceContents = utils.getIDLFile(sourceFile.path());
    let tree = webidl2.parse(this._sourceContents);
    let msg;
    for (let t of tree) {
      switch (t.type) {
        case 'eof':
          break;
        case 'interface':
          this._sourceData = t;
          this._type = t.type;
          if ((!this.originTrial) && (!this.flagged)) { break; }
          const includeRTE = (this.flagged && this._includeExperimental);
          const includeOT = (this.originTrial && this._includeOriginTrials);
          if (includeOT || includeRTE) {
            break;
          } else {
            throw new IDLFlagError();
          }
          break;
        default:
          msg = `${t.type},${sourceFile.path()},The type contained in this file is not currently processible.`;
          if (global.__logger) {
            global.__logger.info(msg);
          }
          break;
      }
      if (this._sourceData) { return; }
    }
    if (!this._sourceData) {
      const msg = `The ${sourceFile.path()} file is invalid or does not contain interface data.`;
      throw new IDLError(msg);
    }
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
    // record.type = options.idlData.type;
    record.type = TYPES[options.idlData.type];
    return record;
  }

  _getExtendedAttribute(member, attributeName) {
    if (!member.extAttrs) { return null; }
    const attributeValue = member.extAttrs.items.find(attr => {
      return attr.name === attributeName;
    });
    if (attributeValue && (attributeValue.rhs)) {
      return attributeValue.rhs.value;
    } else {
      return null;
    }
  }

  _getFlagStatus(member) {
    const attribute = this._getExtendedAttribute(member, 'RuntimeEnabled')
    if (attribute) {
      // return this._flags[attribute];
      return global.__Flags[attribute];
    } 
    return false;
  }

  _getIdentifiers(separator, options = { type: 'name', stableOnly: false }) {
    let identifiers = [];
    identifiers.push(this.name);
    if (options.type === 'interface') {
      if (this.hasConstructor) {
        let signature = `${this.name}${separator}${this.name}`;
        let signatures = this.signatures.map(sig => {
          return `${signature}(${sig})`;
        })(signature);
        identifiers = [identifiers, ...signatures];
      }
    }
    this._sourceData.members.map(m => {
      if (options.stableOnly === true) {
        if (!this._isBurnable(m)) { return; }
      }
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
          break;
        default:
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

  _isBurnable(member) {
    // if (!this._includeTest && (this._getFlagStatus(member) === 'test')) {
    //   return false;
    // }
    if (this._includeExperimental) {
      return this._getFlagStatus(member) === 'experimental';
    }
    if (this._includeOriginTrials) {
      return this._getFlagStatus(member) === 'experimental';
    }
    return true;
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

  _shouldBurn(member) {
    if (!this._isBurnable(member)) { return false; }
    if (member.stringifier) { return false; }
    if (member.deleter) { return false; }
    return true;
  }

  get burnable() {
    return this._isBurnable(this._sourceData);
  }

  get constants() {
    let returns = this._sourceData.members.filter(m => {
      if (!m.type === 'const') { return false; }
      if (this._isBurnable(m)) { return true; }
    });
    if (returns.length === 0) { return null; }
    return returns;
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

  get flag() {
    // Temporary implementation.
    throw new IDLError('Time to deal with flag().');
    return 'stable';
  }

  get flagged() {
    const flag = this._getFlagStatus(this._sourceData);
    switch (flag) {
      case (flag === 'stable'):
        return false;
      case (flag === false):
        return false;
      default:
        return true;
    }
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

  get interfaces() {
    return this._getIdentifiers(',', { type: 'interface' });
  }

  get keys() {
    return this._getIdentifiers('.');
  }


  getkeys(stableOnly = false) {
    return this._getIdentifiers('.', { stableOnly: stableOnly });
  }

  get maplike() {
    return this._sourceData.members.some(m => {
      return m.type === 'maplike';
    });
  }

  get members() {
    let members = new Map();
    for (let m of this._sourceData.members) {
      members.set(m.name, m);
    }
    return members;
  }

  get methods() {
    let returns = this._sourceData.members.filter(item => {
      return item.type === 'operation';
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  get name() {
    return this._sourceData.name;
  }

  get originTrial() {
    if (this._getExtendedAttribute(this._sourceData, 'OriginTrialEnabled')) {
      return true;
    }
    return false;
  }

  get properties() {
    let returns = this._sourceData.members.filter(item => {
      return item.type === 'attribute';
    });
    if (returns.length === 0) { return null; }
    return returns;
  }

  getSecureContext(member = this._sourceData) {
    if (this._getExtendedAttribute(this._sourceData, 'SecureContext')) {
      return true;
    }
    return false;
  }

  get setters() {
    throw new IDLError('Time to deal with setters.')
  }

  get signatures() {
    try {
      return this._sourceData.extAttrs.items.map(i => {
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

  get stringifier() {
    throw new IDLError('Time to deal with stringifier.')
  }

  get urls() {
    return this._getIdentifiers('/');
  }

  writeKeys(keyFile) {
    const keys = this.getkeys(true);
    if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
    for (let k of keys) {
      fs.appendFileSync(keyFile, `${k}\n`);
    }
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

module.exports.EMPTY_BCD_DATA = EMPTY_BCD_DATA;
module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.IDLFlagError = IDLFlagError;
module.exports.InterfaceData = InterfaceData;
