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

  _loadTree(fileName) {
    this.sourceContents = utils.getIDLFile(fileName);
    let tree = webidl2.parse(this.sourceContents);
    for (let t in tree) {
      if (tree[t].type == 'interface') {
        this._interface = tree[t];
        break;
      }
    }
    if (!this._interface) {
      throw "The supplied file does not contain an interface structure.";
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
          let property = {
            "name": mems[m].escaped,
            "arguments": [],
            "interface": mems[m].escaped + "("
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

  get url() {
    return bcd.api[this.name];
  }

  hasConstructor() {
    // extAttrs.items[e].name
    let has = false;
    // if (!this._tree.extAttrs) { return has; }
    let items = this._interface.extAttrs.items;
    for (let i in items) {
      if (items[i].name === 'Constructor') {
        has = true;
      }
    }
    return has;
  }
}

module.exports.InterfaceData = InterfaceData;
