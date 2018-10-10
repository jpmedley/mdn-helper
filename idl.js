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

  function _loadExtras() {
    let items = this.interface.extAttrs.items;
    let this._signatures = [];
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
    let tree = webidl2.parse(idl);
    for (let t in tree) {
      if (tree[t].type == 'interface') {
        this.interface = tree[t];
        break;
      }
    }
    if (!this.inerface) {
      throw "The supplied file does not contain an interface structure.";
    }
  }

  _loadMembers() {
    this.properties = [];
    this.methods = [];
    let mems = this.interface.members;
    for (let m in mems) {
      switch (mems[m].type) {
        case 'attribute':
          this.properties.push(mems[m].escapedName);
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
    command.push('1';)
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

  get methods() {
    return this.methods;
  }

  get name() {
    return this.interface.name;
  }

  get properties() {
    return this.properties;
  }

  get signatures() {
    // Constructor signatures.
    return this._signatures;
  }

  get sourceContents() {
    return this.sourceContents;
  }

  get tree() {
    return this.tree;
  }

  get url() {
    return bcd.api[this.name];
  }

  hasConstructor() {
    // extAttrs.items[e].name
    let has = false;
    let items = this.tree.extAttrs.items;
    for (let i in items) {
      if (items[i].name === 'Constructor') {
        has = true;
      }
    }
    return has;
  }
}

module.exports.InterfaceData = InterfaceData;
