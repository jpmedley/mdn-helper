'use strict';

const { FlagStatus } = require('./flags.js');
const { Pinger } = require('./pinger.js');
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

class InterfaceData {
  constructor(sourceFile, options) {
    this._flags = FlagStatus;
    this._loadTree(sourceFile);
    this._includeExperimental = options.experimental;
    this._includeOriginTrials = options.originTrials;
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
      // Currently returns the first item found.
      switch (t.type) {
        case 'dictionary':
        case 'typedef':
          msg = `The ${sourceFile.path()} contains a ${t.type} which is not currently processible.`;
          global.__logger.info(msg);
          break;
        case 'interface':
          this._sourceData = t;
          this._type = t.type;
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
    record.flag = this.isFlagged(options.idlData);
    record.origin_trial = this.isOriginTrial(options.idlData);
    return record;
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
    if (!this._sourceData) {
      const msg = `The ${sourceFile.path()} file does not contain interface data.`;
      throw new IDLError(msg);
    }
  }

  _getFlagStatus(member) {
    return this._flags[this._getFlag(member)];
  }

  _getIdentifiers(separator, type='name') {
    let identifiers = [];
    identifiers.push(this.name);
    if (type === 'interface') {
      if (this.hasConstructor) {
        let signature = `${this.name}${separator}${this.name}`;
        let signatures = this.signatures.map(sig => {
          return `${signature}(${sig})`;
        })(signature);
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

  _isBurnable(member) {
    // if (!this._includeTest && (this._getFlagStatus(member) === 'test')) {
    //   return false;
    // }
    if (!this._includeExperimental && (this._getFlagStatus(member) === 'experimental')) {
      return false;
    }
    if (!this._includeOriginTrials && (this.isOriginTrial(member))) {
      return false;
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
        break;
      case 'attribute':
        return member.name;
      default:
        return 'what';
    }
  }

  _shouldBurn(member) {
    if (!this._isBurnable) { return false; }
    const skipList = ['const','iterable','maplike','setlike'];
    if (skipList.includes(member.type)) { return false; }
    if (member.stringifier) { return false; }
    if (member.deleter) { return false; }
    return true;
  }

  get burnable() {
    return this._isBurnable(this._sourceData);
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
    if (this.hasConstructor) { command.push('-c'); }
    if (this.iterable) { command.push('-it'); }
    if (this.maplike) { command.push('-mp'); }
    let ehs = this.eventHandlers;
    for (let e in ehs) {
      command.push('-h');
      command.push(ehs[e]);
    }
    let meths = this.methods;
    for (let m in meths) {
      if (meths[m].stringifier) { continue; }
      command.push('-m');
      command.push(meths[m].body.name.value);
    }
    let props = this.properties;
    for (let p in props) {
      command.push('-p');
      command.push(props[p].name);
    }
    return command;
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
    throw new IDLError('Time to deal with deleaters.')
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
    return 'stable';
    // if (!this._sourceData.extAttrs) { return null; }
    // return this._flags[this._sourceData.extAttrs.rhs.value];
  }

  get flagged() {
    if (this._getFlagStatus(this._sourceData) === 'stable') {
      return false;
    }
    return true;
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
    return this._getIdentifiers(',', 'interface');
  }

  get keys() {
    return this._getIdentifiers('.');
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
    if (this._getOriginTrial(this._sourceData)) {
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
    return member.extAttrs.items.some(i => {
      return i.name == 'SecureContext';
    })
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
          options.key = `${this._sourceData.name}.${name}`;
          records.push(this._generateRecord(options));
        }
      })
    }
    return records;
  }

  getSecureContext(member = this._sourceData) {
    return member.extAttrs.items.some(i => {
      return i.name == 'SecureContext';
    })
  }

  isFlagged(searchRoot) {
    if (!searchRoot.extAttrs) { return false; }
    return searchRoot.extAttrs.items.some(attr => {
      return attr.name === 'RuntimeEnabled';
    });
  }

  isOriginTrial(searchRoot) {
    if (!searchRoot.extAttrs) { return false; }
    return searchRoot.extAttrs.items.some(attr => {
      return attr.name == 'OriginTrialEnabled';
    });
  }
}

module.exports.EMPTY_BCD_DATA = EMPTY_BCD_DATA;
module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.InterfaceData = InterfaceData;
