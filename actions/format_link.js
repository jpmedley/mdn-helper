'use strict';

const utils = require('../utils.js');
const page = require('../page.js');

async function _run(currentPage, question) {
  const answer = question.answer;
  // We can assume answer has a '#' because it was
  //   validated before this was called.
  if (answer.startsWith('#')) { return; }
  let pieces = answer.split('#');
  question.answer = '#' + pieces[1];
  console.log(question.answer);
}

module.exports.run = _run;
