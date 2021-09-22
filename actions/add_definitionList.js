// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const page = require('../page.js');
const utils = require('../utils.js');

async function _run(currentPage, question) {
  if (question.answer == question.default) { return; }
  let newContents = '';
  let answers = question.answer.split(',');
  for (let a in answers) {
    const tempPage = new page.Page('temporary', question.action.args[0], currentPage.sharedQuestions);
    tempPage.introMessage = '';
    tempPage.questions.answer('argument', answers[a]);
    await tempPage.askQuestions(`\nArgument ${answers[a]}:`);
    tempPage.render();
    newContents += tempPage.contents;
  }
  newContents = ("<dl>\n" + newContents + "</dl>");
  question.answer = newContents;
  utils.sendUserOutput((`-`.repeat(23)) + '\nFinished with the list.\n');
}

module.exports.run = _run;
