'use strict';

const actions = require('./actions');
const cb = require('prompt-checkbox');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const page = require('./page.js');
const radio = require('radio-symbol');
const utils = require('./utils.js');

class _Directory {
  constructor() {
    this.idlSet = new fm.IDLFileSet();
  }

  async find(interfaceNamed) {
    // const idlSet = new fm.IDLFileSet();
    const matches = this.idlSet.findMatching(interfaceNamed);
    let names = [];
    for (let m in matches) {
      names.push(matches[m].name)
    }
    let enq = new Enquirer();
    enq.register('checkbox', cb);
    enq.question('idlFile', 'Which IDL file?', {
      type: 'checkbox',
      checkbox: radio.star,
      choices: names
    });
    await enq.prompt('idlFile')
    .then(answers => {
      // console.log(answers);
    })
    .catch(err => {
      // console.log(err);
    })
  }

}

class _Manual {
  constructor(args) {
    this._initPages(args);
  }


  _initPages(args) {
    let parentType = args[0];
    let parentName = args[1].split(',')[1];

    // Add space for interface or header name to sharedQuestions,
    //  and remove it from args.
    let introMessage = `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\nYou will now be asked questions for answers that are shared\namong all the files to be created.\n`;
    let sharedQuestions = new page.Questions(introMessage);
    sharedQuestions[parentType] = parentName;
    sharedQuestions['name'] = parentName;
    sharedQuestions.add(parentType, parentName);
    args.shift();
    args.shift();

    // Process remaining arguments.
    this.pages = new Array();
    args.forEach((arg, index, args) => {
      let members = arg.split(',');
      let aPage = new page.Page(members[1], members[0], sharedQuestions);
      this.pages.push(aPage);
    });
  }

  async create() {
    // utils.openInteraction();
    for (let p in this.pages) {
      await this.pages[p].askQuestions();
      this.pages[p].write();
    }
    // utils.closeInteraction();
  }

}



module.exports.Manual = _Manual;
module.exports.Directory = _Directory;
