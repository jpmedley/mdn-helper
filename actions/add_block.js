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
