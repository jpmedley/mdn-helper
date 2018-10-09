'use strict';

const actions = require('./actions');
const Enquirer = require('enquirer');
const fm = require('./filemanager.js');
const page = require('./page.js');
// const Choices = require('prompt-choices');
const cb = require('prompt-checkbox');
const radio = require('radio-symbol');
const utils = require('./utils.js');

function _initPages(args) {
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
  let pages = new Array();
  args.forEach((arg, index, args) => {
    let members = arg.split(',');
    let aPage = new page.Page(members[1], members[0], sharedQuestions);
    pages.push(aPage);
  });
  return pages;
}

async function create(args) {
  let pages = _initPages(args);
  for (let p in pages) {
    await pages[p].askQuestions();
    pages[p].write();
  }
  utils.closePrompt();
}

async function find(interfaceNamed) {
  const idlSet = new fm.IDLFileSet();
  const matches = idlSet.findMatching(interfaceNamed);
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

module.exports.create = create;
module.exports.find = find;
