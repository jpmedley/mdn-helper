'use strict';

const fs = require('fs');
const utils = require('./utils.js');

const DONT_ASK = 'Don\'t ask.';
const NO_ANSWER = '';
const QUESTIONS_FILE = utils.getConfig('questionsFile');
const QUESTION_RE = /(\[\[([\w\-\_:]+)\]\])/gm;
const TEMPLATES = 'templates/';


const _questionTemplates = getTemplates();

function getTemplates() {
  const questionPath = TEMPLATES + QUESTIONS_FILE
  const questionBuffer = fs.readFileSync(questionPath);
  const templates =  JSON.parse(questionBuffer.toString()).templates;
  return templates;
}

class _Question {
  constructor(templateName) {
    const template = _questionTemplates[templateName];
    for (let t in template) {
      this[t] = template[t];
    }
    this.answer ='';
  }

  ask() {
    let prompt = "\n" + this.question;
    if (this.default) {
      prompt += (" (" + this.default + ")");
    }
    prompt += "\n";
    return new Promise((resolve, reject) => {
      utils.prompt.question(prompt, (answer) => {
        if (answer == '') {
          this.answer = this.default;
        } else {
          this.answer = answer;
        }
        resolve();
      });
    });
  }
}

class _Questions {
  constructor() {
    this.questions = new Object();
  }

  add(question, answer='') {
    if (_questionTemplates[question] == DONT_ASK) { return; }
    if (!this.questions.hasOwnProperty(question)) {
      this.questions[question] = new _Question(question);
      this.questions[question].answer = answer;
    }
  }

  async askQuestions(introMessage){
    console.log(introMessage);
    for (let q in this.questions) {
      // console.log(this.questions[q]);
      if ( this.questions[q].answer != '') { continue; }
      let p = await this.questions[q].ask();
    }
  }

  needsAnswers() {
    for (var p in this.questions) {
      if (this.questions[p] == '') {
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

    let templatePath = TEMPLATES + this.type.toLowerCase() + ".html";
    let buffer = fs.readFileSync(templatePath);
    this.contents = buffer.toString();

    let tokens = this.contents.match(QUESTION_RE);
    for (let t in tokens) {
      let question = tokens[t];
      if (question.startsWith('[[shared:')) {
        question = question.split(':')[1];
        question = question.slice(0, -2);
        this.sharedQuestions.add(question);
      } else {
        question = question.slice(2, -2);
        this.questions.add(question)
      }
    }
  }

  async askQuestions(introMessage) {
    await this.questions.askQuestions(introMessage);
  }

  write() {
    const matches = this.contents.match(QUESTION_RE);
    for (let m in matches) {
      let token;
      let answer;
      if (matches[m].startsWith('[[shared:')) {
        token = matches[m].slice(9, -2);
        answer = this.sharedQuestions.questions[token].answer;
      } else {
        token = matches[m].slice(2, -2);
        answer = this.questions.questions[token].answer;
      }
      if (answer == DONT_ASK) { continue; }
      if (answer == NO_ANSWER) { continue; }
      this.contents = this.contents.replace(matches[m], answer);
    }
    let outPath = utils.OUT + this.sharedQuestions.name + "_" + this.name + "_" + this.type + ".html";
    fs.writeFileSync(outPath, this.contents);
  }
}

module.exports.Page = _Page;
module.exports.Questions = _Questions;
