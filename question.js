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

const actions = require('./actions');
const Enquirer = require('enquirer');
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
