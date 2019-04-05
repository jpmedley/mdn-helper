'use strict';

const actions = require('./actions');
const Enquirer = require('enquirer');
const { help } = require('./help/help.js');
const utils = require('./utils.js');


class _Question {
  constructor(wireFrameName) {
    const wireframe = utils.WIREFRAMES[wireFrameName];
    for (let w in wireframe) {
      this[w] = wireframe[w];
    }
    this.name = wireFrameName;
    this.answer = null;
  }

  _isAnswerValid() {
    if (!this.pattern) { return true; }
    const regex = RegExp(this.pattern, 'g');
    const result = regex.exec(this.answer);
    if (!result) {
      return false;
    }
    return true;
  }

  async _prompt() {
    let enq = new Enquirer();
    let options = { message: this.question };
    if (this.default) {
      options.default = this.default;
    }
    enq.question(this.name, options);
    let tempAnswer = await enq.prompt(this.name);
    // Convert Enquirer answer to mdn-helper answer.
    this.answer = tempAnswer[this.name];
    if (!this._isAnswerValid()) {
      console.log(this.help);
      await this._prompt();
    }
  }

  async ask(forPage) {
    try {
      await this._prompt(this.text);
    } catch(e) {
      throw e;
    } finally {
      if (this.action) {
        await actions[this.action.name].run(forPage, this);
      }
      forPage.contents = forPage.contents.replace(this.token, this.answer);
    }

  }

  get text() {
    let text = "\n" + this.question;
    if (this.default) {
      text += (" (" + this.default + ")");
    }
    text += "\n";
    return text;
  }

  get token() {
    return "[[" + this.name + "]]";
  }
}

module.exports.Question = _Question;
