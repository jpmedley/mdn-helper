'use strict';

const utils = require('../utils.js');
const page = require('../page.js');

async function _run(currentPage, question) {
  const answer = question.answer.toLowerCase();
  if (answer.startsWith('n')) {
    question.answer = '';
    return;
  }
  const tempPage = new page.Page('temporary', question.action.args[0], currentPage.sharedQuestions);
  let msg;
  if (currentPage.sharedQuestions.needsAnswers()) {
    msg = "More shared shared questions found."
    await currentPage.sharedQuestions.askQuestions(msg);
  }
  if (tempPage.questions.needsAnswers()) {
    msg = `\tYou will now be asked to provide answers for ${question.name}.`;
    await tempPage.askQuestions(msg);
  }
  question.answer = tempPage.contents;
}

module.exports.run = _run;
