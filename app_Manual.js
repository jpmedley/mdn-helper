'use strict';

const actions = require('./actions');
const page = require('./page.js');
const utils = require('./utils.js');

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
    for (let p in this.pages) {
      await this.pages[p].askQuestions();
      this.pages[p].write();
    }
  }

}

module.exports.Manual = _Manual;
