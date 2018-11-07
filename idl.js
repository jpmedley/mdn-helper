'use strict';

const bcd = require('mdn-browser-compat-data');
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

class IDLError extends Error {
  constructor(message, fileName='', lineNumber='') {
    super(message, fileName, lineNumber);
  }
}

class InterfaceData {
  constructor(sourceFile) {
    this._loadTree(sourceFile);
    this._loadExtras();
    this._loadMembers();
  }

  _loadTree(sourceFile) {
    this.sourceContents = utils.getIDLFile(sourceFile.path());
    let tree = webidl2.parse(this.sourceContents);
    for (let t in tree) {
      switch (tree[t].type) {
        case 'dictionary':
          // For now, don't include dictionaries in the log file.
          // const msg = `File ${sourceFile} is for a dictionary.`;
          // throw new IDLError(msg);
          break;
        case 'interface':
          this._interface = tree[t];
          break;
      }
    }
    if (!this._interface) {
      const msg = `The ${sourceFile} file does not contain interface data.`;
      throw new IDLError(msg);
    }
  }

  _loadExtras() {
    if (!this._interface.extAttrs) { return; }
    let items = this._interface.extAttrs.items;
    this._signatures = [];
    for (let i in items) {
      switch (items[i].name) {
        case 'Constructor':
          this._constructor = true;
          if (items[i].signature) {
            this._signatures.push(items[i].signature.arguments);
          }
          break;
        case 'RuntimeEnabled':
          this._flag = items[i].rhs.value;
          break;
      }
    }
  }

  _loadMembers() {
    // START HERE: Test getConstructors().
    this._getConstructors();
    this._eventhandlers = [];
    this._getters = [];
    this._methods = [];
    this._properties = [];
    this._setters = [];
    let property;
    let subType;
    let args;
    let mems = this._interface.members;
    for (let m in mems) {
      switch (mems[m].type) {
        case 'attribute':
          subType = this._getAttributeSubType(mems[m]);
          property = subType;
          property.interface = subType.name;
          switch (subType.type) {
            case 'eventhandler':
              this._eventhandlers.push(property);
              break;
            case 'method':
              // args = this._getArguments(mems[m]);
              if (mems[m].body) {
                args = this._getArgumentString(mems[m].body.arguments);
                property.interface += ("(" + args + ")");
              }
              this._methods.push(property);
              break;
            case 'property':
              this._properties.push(property);
              break;
          }
          break;
        case 'operation':
          subType = this._getOperationSubType(mems[m]);
          switch (subType.type) {
            case 'getter':
              property = subType;
              property.interface = subType.name;
              this._getters.push(property);
              break;
            case 'method':
              property = subType;
              property.interface = subType.name;
              // args = this._getArguments(mems[m]);
              if (mems[m].body) {
                args = this._getArgumentString(mems[m].body.arguments);
                property.interface += ("(" + args + ")");
              }
              this._methods.push(property)
              break;
            case 'setter':
              property = subType;
              property.interface = subType.name;
              this._setters.push(property);
            case 'stringifier':
              //
              break;
          }
      }
    }
  }

  _getOperationSubType(member) {
    let name;
    if (member.stringifier) { return { "type": "stringifier", "name": null }; }
    if (member.getter) {
      if (member.body.name) {
        name = member.body.name.escaped;
      } else if (member.body.idlType) {
        name = member.body.idlType.baseName;
      } else if (member.extAttrs.items[0].rhs) {
        name = member.extAttrs.items[0].rhs.value;
      }
      return { "type": "getter", "name": name };
    }
    if (member.setter) {
      return { "type": "setter", "name": "[]"};
    }
    if (member.deleter) {
      return { "type": "deleter", "name": "deleter"};
    }
    name = member.body.name.escaped;
    return { "type": "method", "name": name };
  }

  _getAttributeSubType(member) {
    switch (member.idlType.baseName) {
      case 'EventHandler':
        return { "type": "eventhandler", "name": member.escapedName };
        break;
      case 'Promise':
        return { "type": "method", "name": member.escapedName };
        break;
      default:
        return { "type": "property", "name": member.escapedName };
    }
  }

  _getArgumentString(args) {
    let argString = '';
    if (args.length) {
      for (let a in args) {
        argString += (args[a].idlType.baseName + " " + args[a].name + ", ");
      }
      argString = argString.slice(0, -2); // Chop last comma and space.
    }
    return argString;
  }

  _getConstructors() {
    if (!this._interface.extAttrs) { return; }
    let extras = this._interface.extAttrs.items;
    let sig;
    for (let e in extras) {
      if (extras[e].name == 'Constructor') {
        if (extras[e].signature) {
          sig += (this._getArgumentString(extras[e].signature.arguments) || '');
        }
        this._signatures.push(sig);
      }
    }
  }

  _getOperationSubType(member) {
    let name;
    if (member.stringifier) { return { "type": "stringifier", "name": null }; }
    if (member.getter) {
      if (member.body.name) {
        name = member.body.name.escaped;
      } else if (member.body.idlType) {
        name = member.body.idlType.baseName;
      } else if (member.extAttrs.items[0].rhs) {
        name = member.extAttrs.items[0].rhs.value;
      }
      return { "type": "getter", "name": name };
    }
    if (member.setter) {
      return { "type": "setter", "name": "[]" };
    }
    if (member.deleter) {
      return { "type": "deleter", "name": "deleter" };
    }
    name = member.body.name.escaped;
    return { "type": "method", "name": name };
  }

  _getAttributeSubType(member) {
    switch (member.idlType.baseName) {
      case 'EventHandler':
        return { "type": "eventhandler", "name": member.escapedName };
        break;
      case 'Promise':
        return { "type": "method", "name": member.escapedName };
        break;
      default:
        return { "type": "property", "name": member.escapedName };
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

  _getConstructors() {
    if (!this._interface.extAttrs) { return; }
    let extras = this._interface.extAttrs.items;
    let sig;
    for (let e in extras) {
      if (extras[e].name == 'Constructor') {
        sig = "(";
        if (extras[e].signature) {
          sig += this._getArgumentString(extras[e].signature.arguments);
        }
        sig += ")";
      }
      this._signatures.push(sig);
    }
  }

  getBurnRecords(includeFlags=false) {
    if (!includeFlags && this.flag) { return; }
    let keys = this.keys;
    let records = [];
    for (let k in keys) {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.key = keys[k];
      let tokens = keys[k].split('.');
      let data = bcd.api[tokens[0]];
      if (data && tokens.length > 1) {
        data = bcd.api[tokens[0]][tokens[1]];
      }
      if (!data) {
        record.bcd = false;
        record.mdn_exists = false;
      } else {
        record.bcd = true;
        if (data.__compat) {
          record.mdn_url = data.__compat.mdn_url;
        } else {
          record.mdn_exists = false;
        }
      }
      records.push(record);
    }
    return records;
  }

  get command() {
    let command = [];
    command.push('0');
    command.push('1');
    command.push('interface');
    command.push('-n');
    command.push(this.name);
    command.push('-l');
    command.push('-r');
    if (this.hasConstructor()) { command.push('-c'); }
    let methods = this.methods;
    for (let m in methods) {
      command.push('-m');
      command.push(methods[m].name + '()');
    }
    let properties = this.properties;
    for (let p in properties) {
      command.push('-p');
      command.push(properties[p].name);
    }
    return command;
  }

  get eventhandlers() {
    return this._eventhandlers;
  }

  get flag() {
    return this._flag;
  }

  set flag(flagName) {
    this._flag = flagName;
  }

  get getters() {
    return this._getters;
  }

  get interfaces() {
    return this._getIdentifiers('.', 'interface');
  }

  get keys() {
    return this._getIdentifiers('.');
  }

  get methods() {
    return this._methods;
  }

  get name() {
    return this._interface.name;
  }

  get properties() {
    return this._properties;
  }

  get signatures() {
    // Constructor signatures.
    return this._signatures;
  }

  get sourceContents() {
    return this._sourceContents;
  }

  set sourceContents(contents) {
    this._sourceContents = contents;
  }

  get tree() {
    return this._tree;
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
    for (let e in this._eventhandlers) {
      identifiers.push(this.name + separator + this._eventhandlers[e][type]);
    }
    for (let g in this._getters) {
      identifiers.push(this.name + separator + this._getters[g][type]);
    }
    for (let m in this._methods) {
      identifiers.push(this.name + separator + this._methods[m][type]);
    }
    for (let p in this._properties) {
      identifiers.push(this.name + separator + this._properties[p][type]);
    }
    for (let s in this._setters) {
      identifiers.push(this.name + this._setters[s][type]);
    }
    return identifiers;
  }

  hasConstructor() {
    return this._constructor;
  }
}

module.exports.EMPTY_BURN_DATA = EMPTY_BURN_DATA;
module.exports.InterfaceData = InterfaceData;
