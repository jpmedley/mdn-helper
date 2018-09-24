'use strict';

const utils = require('../utils.js');
const page = require('../page.js');

const _questionWireframes = utils.getWireframes();

async function _run(currentPage, question) {
  const token = '[[' + question.name + ']]';
  const answer = question.answer.toLowerCase();
  if (answer.startsWith('n')) {
    currentPage.contents = currentPage.contents.replace(token, '');
    return;
  }
  const tempPage = new page.Page('temporary', question.action.args[0], currentPage.sharedQuestions)
  let msg = `\tYou will now be asked to provide answers for ${question.name}.`;
  await tempPage.askQuestions(msg);
  currentPage.contents = currentPage.contents.replace(token, tempPage.contents);

}

module.exports.run = _run;
