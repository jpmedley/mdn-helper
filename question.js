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
const { Confirm, Input } = require('enquirer');
const utils = require('./utils.js');

const INPUT_TYPES = {
  "Confirm": Confirm,
  "Input": Input
}


class _Question {
  constructor(wireFrameName) {
    const wireframe = utils.WIREFRAMES[wireFrameName];
    for (let w in wireframe) {
      this[w] = wireframe[w];
    }
    this.name = wireFrameName;
    this.answer = null;
  }

  _validate() {
    if (!this.question.pattern) { return true; }
    const regex = RegExp(this.question.pattern, 'g');
    let answer = new String(this.result());
    answer = answer.valueOf();
    const result = regex.exec(answer);
    if (!result) {
      return this.question.help;
    }
    return true;
  }

  _format(value) {
    switch (this.question.type) {
      case 'Confirm':
        return value ? 'yes' : 'no';
      default:
        return value;
    }
  }

  async _prompt() {
    const Prompt = INPUT_TYPES[this.type];
    const prompt = new Prompt({
      name: 'question',
      message: this.question,
      initial: this.default,
      validate: this._validate,
      format: this._format,
      question: this
    });
    this.answer = await prompt.run();
  }

  async ask(forPage) {
    try {
      await this._prompt(this.text);
    } catch(e) {
      throw e;
    } finally {
      // Start Here: Which property tells me whether the action can run.
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
