'use strict';

const utils = require('../utils.js');

const _questionWireframes = utils.getWireframes();

function _run(questionName, question, page='') {
  // console.log("It worked!");
  // console.log(page);
  // console.log(args);
  console.log(question.answer);

    const block = utils.getTemplate(question.action.args[0]);


    const token = "[[" + questionName + "]]";
    page.contents = page.contents.replace(token, block);
    // console.log(page.contents);
}

module.exports.run = _run;
