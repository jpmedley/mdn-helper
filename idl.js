'use strict';

const bcd = require('mdn-browser-compat-data');
const utils = require('./utils.js');
const webidl2 = require('webidl2');

class InterfaceData {
  constructor(sourceFile) {
    this._loadTree(sourceFile);
    this._loadExtras();
    this._loadMembers();
  }

  _loadExtras() {
    if (!this._interface.extAttrs) { return; }
    let items = this._interface.extAttrs.items;
    this._signatures = [];
    for (let i in items) {
      switch (items[i].name) {
        case 'Constructor':
          if (items[i].name.signature) {
            this._signatures.push(items[i].name.signature.arguments);
          }
          break;
        case 'RuntimeEnabled':
          this._flag = items[i].rhs.value;
          break;
      }
    }
  }

  _loadTree(fileObject) {
    this.sourceContents = utils.getIDLFile(fileObject.path());
    let tree = webidl2.parse(this.sourceContents);
    for (let t in tree) {
      switch (tree[t].type) {
        case 'dictionary':
        case 'interface':
          this._interface = tree[t];
          break;
      }
    }
    if (!this._interface) {
      throw `The ${fileObject.path()} file does not contain interface data.`;
    }
  }

  _loadMembers() {
    this._properties = [];
    this._methods = [];
    let mems = this._interface.members;
    for (let m in mems) {
      switch (mems[m].type) {
        case 'attribute':
          this._properties.push(mems[m].escapedName);
          break;
        case 'operation':
          let property;
          if (mems[m].getter) {
            property = {
              "name": mems[m].body.name.escaped,
              "arguments": [],
              "interface": mems[m].body.name.escaped + "("
            }
          } else {
            property = {
              "name": mems[m].escaped,
              "arguments": [],
              "interface": mems[m].escaped + "("
            }
          }
          if (mems[m].body.arguments) {
            let argument
            for (let a in mems[m].body.arguments) {
              argument = {
                "name": mems[m].body.arguments[a].escapedName,
                "type": mems[m].body.arguments[a].idlType.baseName
              };
              property.interface += (argument.name + " " + argument.type + ",");
              property.arguments.push(argument);
            }
          }
          property.interface = property.interface.slice(0, -1);
          property.interface += ")";
          break;
      }
    }
  }

  get command() {
    let command = [];
    command.push('0');
    command.push('1');
    command.push('interface');
    command.push('-n');
    command.push(this.name);
    command.push('-o');
    command.push('-i');
    if (this.hasConstructor()) { command.push('-c'); }
    let methods = this.methods;
    for (let m in methods) {
      command.push('-m');
      command.push(method[m] + '()');
    }
    let properties = this.properties;
    for (let p in properties) {
      command.push('-p');
      command.push(properties[p]);
    }
    let cleanCommand = utils.getRealArguments(command);
    return cleanCommand;
  }

  get flag() {
    return this._flag;
  }

  set flag(flagName) {
    this._flag = flagName;
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

  _getIdentifiers(separator) {
    let urls = [];
    urls.push(this.name);
    if (this.hasConstructor()) {
      urls.push(this.name + separator + this.name);
    }
    for (let m in this.methods) {
      urls.push(this.name + separator + this.methods[m]);
    }
    for (let p in this.properties) {
      urls.push(this.name + separator + this.properties[p]);
    }
    return urls;
  }

  hasConstructor() {
    if (this._signatures) { return true; }
    return false;
  }
}

module.exports.InterfaceData = InterfaceData;
