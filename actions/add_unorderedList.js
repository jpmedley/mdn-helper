'use strict';

const page = require('../page.js');

function _run(currentPage, question) {
  let newContents;
  newContents = "<ul>"
  let answers = question.answer.split(',');
  answers.forEach((answer, i, answers) => {
    const tempPage = new page.Page('temporary', question.action.args[0], currentPage.sharedQuestions);
    //Start Here: Add answers to constructor arguments.
  })
}

module.exports.run = _run;
