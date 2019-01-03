'use strict';

const fs = require('fs');
const utils = require('./utils.js');

const API_TEMPLATE = fs.readFileSync('templates/bcd-api.txt');
const CONSTR_TEMPLATE = fs.readFileSync('templates/bcd-constructor.txt');
const MEMBER_TEMPLATE = fs.readFileSync('templates/bcd-member.txt');

function _copyString(oldString) {
  return (' ' + oldString).slice(1);
}

class _BCDManager {
  constructor(type = 'api') {
    // Later this will need to distinguish BCD categories.
    this._bcdString = '';
  }

  _write(outFilePath) {
    let file = utils.getOutputFile(outFilePath);
    fs.write(file, this._bcdString, ()=>{});
    fs.close(file, ()=>{});
  }

  getBCD(idl, outFilePath) {
    let members = [];
    if (idl.hasConstructor()) {
      members.push(_copyString(CONSTR_TEMPLATE));
    }
    for (let m of idl.members) {
      let member = _copyString(MEMBER_TEMPLATE)
                   .replace(/\[\[member-name\]\]/g, m[0]);
      members.push(member);
    }
    let memberString = members.join(',\n');
    memberString = memberString.replace('\n,', ',');
    this._bcdString = _copyString(API_TEMPLATE);
    this._bcdString = this._bcdString.replace('[[members]]', members);
    this._bcdString = this._bcdString.replace(/\[\[api-name\]\]/g, idl.name);
    this._write(outFilePath);
    const msg = `BCD boilerplate has been written to ${outFilePath}.`
    console.log(msg);
  }
}

module.exports.BCDManager = _BCDManager;
