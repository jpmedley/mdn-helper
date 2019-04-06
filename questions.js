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
