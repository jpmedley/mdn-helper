'use strict';

function _run(currentPage, question) {
  const answer = question.answer.toLowerCase();
  if (answer.startsWith('n')) {
    question.answer = '';
    return;
  }
  question.answer = question.default;
}

module.exports.run = _run;
