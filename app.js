'use strict';

const actions = require('./actions');
const page = require('./page.js');
const utils = require('./utils.js');

let sharedQuestions = new page.Questions();
// sharedQuestions.on('runAction', (questionName, question) => {
//   actions[question.action].run(questionName, question);
// });

function _initPages(args) {
  let parentType = args[0];
  let parentName = args[1].split(',')[1];

  // Add space for interface or header name to sharedQuestions,
  //  and remove it from args.
  sharedQuestions[parentType] = parentName;
  sharedQuestions['name'] = parentName;
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

  let introMessage = `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\nYou will now be asked questions for answers that are shared\namong all the files to be created.\n`;
  await sharedQuestions.askQuestions(introMessage);

  for (let p in pages) {
    introMessage = `\nQuestions for the ${pages[p].name} page\n` + (`-`.repeat(80)) + `\nYou will now be asked to provide answers for the ${pages[p].name} page.\n`;
    await pages[p].askQuestions(introMessage);
    pages[p].write();
  }
  utils.closePrompt();
}

module.exports.create = create;
