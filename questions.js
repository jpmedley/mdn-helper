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

const config = require('config');
const { Question } = require('./question.js');

const ANSWER_IS_NO = '';
const SKIP_KEY = config.get('Application.questionHiding.use');
const SKIP_KEYS = config.get('Application.questionHiding.' + SKIP_KEY);

class _Questions {
  constructor(intro = '') {
    this.intro = intro;
    this.questions = new Object();
  }

  printIntro() {
    if (this.intro == '') { return; }
    console.log(this.intro);
  }

  set introMessage(message) {
    this.intro = message;
  }

  add(question, answer=null) {
    if (SKIP_KEYS.includes(question)) { answer = ANSWER_IS_NO; }
    if (!this.questions.hasOwnProperty(question)) {
      this.questions[question] = new Question(question);
      this.questions[question].answer = answer;
    }
  }

  answer(question, answer) {
    this.questions[question].answer = answer;
  }

  needsAnswers() {
    for (var p in this.questions) {
      if (this.questions[p].answer === null) { return true; }
    }
    return false;
  }
}

module.exports.Questions = _Questions;
