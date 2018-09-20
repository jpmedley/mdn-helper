'use strict';

const fs = require('fs');

const TEMPLATES = 'templates/';
const QUESTIONS_FILE = utils.getConfig('questionsFile');
const QUESTION_RE = /(\[\[([\w\-\_:]+)\]\])/gm;

const _questionTemplates = () => _loadQuestionTemplates() {
  const questionPath = TEMPLATES + QUESTIONS_FILE
  const questionBuffer = fs.readFileSync(questionPath);
  return JSON.parse(questionBuffer.toString()).templates;
}

class _Question_Factory {
  static getQuestion(type) {
    switch (type) {
      case 'boolean':
        return new _BooleanQuestion();
      case 'string':
        return new _StringQuestion();
    }
  }
}

class _Question {
  constructor(template) {
    for (let t in template) {
      this[t] = template[t];
    }
    this.answer;
  }

  ask() {
    // Is prompt in scope when called as super.ask();
    let prompt = "\n" + this.question;
    if (this.default) {
      prompt += (" (" + this.default + ")");
    }
    prompt += "\n";
  }
}

class _StringQuestion extends _Question {
  super.ask();
  return new Promise((resolve, reject) => {
    utils.prompt.question(question, (answer) => {
      if (answer == '') { answer = this.default; }
      resolve(answer);
    });
  });
}

class _BooleanQuestion extends _Question {

}

class _Questions {
  constructor() {
    this.questions = new Object();
  }

  add(question, value='') {
    if (!this.questions.hasOwnProperty(question)) {
      this.questions[question] = '';
    }
    this.questions[question] = value;
  }

  askAll(){

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
    this.type = name;
    this.sharedQuestions = sharedQuestions;
    this.questions = new _Questions();
    let templatePath = TEMPLATES + this.type.toLowerCase() + ".html";
    this.contents = fs.readFileSync(templatePath);
    let tokens = this.contents.match(QUESTION_RE);
    for (let t in tokens) {
      let question;
      if (tokens[t].startsWith('[[shared:')) {
        question = tokens[t].split(':');
        question = question.slicd(0, -2);
        this.sharedQuestions.add(question);
      } else {
        question = question.slice(2, -2);
        this.questions.add(question)
      }
    }
  }

  write() {
    const matches = this.contents.match(QUESTION_RE);
    for (let m in matches) {
      let token;
      let answer;
      if (matches[m].startsWith('[[shared:')) {
        token = matches[m].slice(9, -2);
      } else {
        token = matches[m].slice(2, -2);
      }
      answer = this.sharedQuestions[token];
      if (answer == DONT_ASK) { continue; }
      if (answer == NO_ANSWER) { continue; }
      this.contents.replace(matches[m], answer);
    }
    let outPath = utils.OUT + this.sharedQuestions.name + "_" + this.name + "_" + this.type + ".html";
    fs.writeFileSync(outPath, this.contents);
  }
}

module.exports.Page = _Page;
module.exports.Questions = _Questions;
