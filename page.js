'use strict';

const actions = require('./actions');
const fs = require('fs');
const readline = require('readline');
const util = require('util');
const utils = require('./utils.js');

const DONT_ASK = 'Don\'t ask.';
const NO_ANSWER = '';

const _questionWireframes = utils.getWireframes();

class _Question {
  constructor(wireframeName) {
    const wireframe = _questionWireframes[wireframeName];
    for (let w in wireframe) {
      this[w] = wireframe[w];
    }
    this.name = wireframeName;
    this.answer ='';
  }

  _isValid() {
    let valid = true;
    if (!this.pattern) { return valid; }
    const regex = RegExp(this.pattern, 'g');
    const result = regex.exec(this.answer);
    if (!result) { valid = false; }
    return valid;
  }

  _prompt(prompt) {
    return new Promise((resolve, reject) => {
      utils.prompt.question(prompt, (answer) => {
        (answer == '') ? this.answer = this.default : this.answer = answer;
        if (this._isValid()) {
          resolve(this);
        } else {
          reject();
        }
      })
    })
  }

  async ask() {
    let prompt = "\n" + this.question;
    if (this.default) {
      prompt += (" (" + this.default + ")");
    }
    prompt += "\n";
    try {
      await this._prompt(prompt);
    } catch(e) {
      console.log("\n" + this.help);
      await this.ask();
    }
    return this;
  }
}

class _Questions {
  constructor() {
    this.questions = new Object();
  }

  add(question, answer='') {
    if (_questionWireframes[question] == DONT_ASK) { return; }
    if (!this.questions.hasOwnProperty(question)) {
      this.questions[question] = new _Question(question);
      this.questions[question].answer = answer;
    }
  }

  async askQuestions(introMessage){
    if (this.needsAnswers()) {
      console.log(introMessage);
      for (let q in this.questions) {
        if ( this.questions[q].answer != NO_ANSWER) { continue; }
        let answeredQuestion = await this.questions[q].ask();
      }
    }
  }

  needsAnswers() {
    for (var p in this.questions) {
      if (this.questions[p].answer == NO_ANSWER) {
        return true;
      }
    }
    return false;
  }
}

class _Page {
  constructor(name, type, sharedQuestions) {
    this.name = name;
    this.type = type;
    this.sharedQuestions = sharedQuestions;
    // The type and name if the interface are also a question.
    this.sharedQuestions.add(type, name);
    this.questions = new _Questions();
    this.contents = utils.getTemplate(this.type.toLowerCase());
    const reg = RegExp(utils.TOKEN_RE, 'g');
    let matches;
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        this.sharedQuestions.add(matches[1]);
      } else {
        this.questions.add(matches[1]);
      }
    }
  }

  async askQuestions(introMessage) {
    console.log(introMessage);
    const questions = this.questions.questions;
    for (let q in questions) {
      if (questions[q].answer != NO_ANSWER) { continue; }
      let answeredQuestion = await questions[q].ask();
      if (answeredQuestion.action) {
        await actions[answeredQuestion.action.name].run(this, answeredQuestion);
      }
    }
  }

  write() {
    const reg = RegExp(utils.TOKEN_RE, 'g');
    let matches;
    let answer
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        answer = this.sharedQuestions.questions[matches[1]].answer;
      } else {
        answer = this.questions.questions[matches[1]].answer
      }
      if (answer == DONT_ASK) { continue; }
      if (answer == NO_ANSWER) { continue; }
      this.contents = this.contents.replace(matches[0], answer);
    }
    let outPath = utils.OUT + this.sharedQuestions.name + "_" + this.name + "_" + this.type + ".html";
    fs.writeFileSync(outPath, this.contents);
  }
}

module.exports.Page = _Page;
module.exports.Questions = _Questions;
