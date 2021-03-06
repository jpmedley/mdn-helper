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

const fs = require('fs');
const { help } = require('./help/help.js');
const { Questions } = require('./questions.js');
const utils = require('./utils.js');

const TOKEN_RE = /\[\[(?:shared:)?([\w\-]+)\]\]/;

class _Page {
  constructor(name, type, sharedQuestions) {
    this.name = name;
    this.type = type;
    this.sharedQuestions = sharedQuestions;

    // The type and name if the interface are also a question.
    this.sharedQuestions.add(type, name);
    let introMessage = `\nQuestions for the ${this.name} ${this.type} page\n` + (`-`.repeat(80)) + help[this.type] + '\n';
    this.questions = new Questions(introMessage);
    this.questions.add(type, name);
    const interfaceTypes = ['interface', 'includes'];
    let templateType;
    if (interfaceTypes.includes(this.type)) {
      templateType = 'interface';
    } else {
      templateType = this.type.toLowerCase();
    }
    this.contents = utils.getTemplate(templateType)
    // this.contents = utils.getTemplate(this.type.toLowerCase());
    const reg = RegExp(TOKEN_RE, 'g');
    let matches;
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        this.sharedQuestions.add(matches[1]);
      } else {
        this.questions.add(matches[1]);
      }
    }
  }

  async askQuestions(extraMessage) {
    if (this.sharedQuestions.needsAnswers()) {
      // extraMessage is proxy for whether this is a first call or
      // one generated by an action. Not ideal, but it's the best
      // currently available.
      if (extraMessage) {
        this.sharedQuestions.introMessage = "More shared questions found.\n" + (`-`.repeat(28))
      }
      await this._askQuestions(this.sharedQuestions);
    }
    if (this.questions.needsAnswers()) {
      if (extraMessage) {
        let len = extraMessage.length;
        extraMessage = extraMessage + '\n' + (`-`.repeat(len));
        this.questions.introMessage = extraMessage;
      }
      await this._askQuestions(this.questions);
    }
  }

  async _askQuestions(questionObject) {
    const questions = questionObject.questions;
    if (questionObject.needsAnswers()) {
      questionObject.printIntro();
    } else {
      return;
    }
    for (let q in questions) {
      if (questions[q].answer) { continue; }
      await questions[q].ask(this);
    }
  }

  render() {
    const reg = RegExp(TOKEN_RE);
    let matches;
    let answer;
    while ((matches = reg.exec(this.contents)) != null) {
      if (matches[0].startsWith('[[shared:')) {
        answer = this.sharedQuestions.questions[matches[1]].answer;
      } else {
        answer = this.questions.questions[matches[1]].answer
      }
      if (answer === null) { answer = ''; }
      this.contents = this.contents.replace(matches[0], answer);
    }
  }

  async _write() {
    this.render();
    let outFolder = utils.makeOutputFolder(this.sharedQuestions.name);
    let outPath = `${outFolder}/${this.sharedQuestions.name}_${this.name}_${this.type}.html`;
    if (fs.existsSync(outPath)) {
      let msg = `A file already exits for ${this.name} ${this.type}. `;
      msg += 'Do you want to overwrite it?'
      const answer = await utils.confirm(msg);
      if (!answer) { return; }
    }
    fs.writeFileSync(outPath, this.contents);
  }

  async write() {
    this.render();
    let outFolder;
    let lcName;
    let msg;
    switch (this.type) {
      case 'landing':
        lcName = this.sharedQuestions.name.toLowerCase();
        outFolder = utils.makeOutputFolder(`${lcName}_${this.type}`);
        break;
      case 'interface':
        lcName = this.name.toLowerCase();
        outFolder = utils.makeOutputFolder(`${lcName}`);
        break;
      default:
        lcName = this.sharedQuestions.interface.toLowerCase();
        outFolder = utils.makeOutputFolder(`${lcName}/${this.name}`);
        break;
    }
    const outPath = `${outFolder}index.html`.toLowerCase();
    if (fs.existsSync(outPath)) {
      msg = `\nA file already exits at:\n\t${outPath}\n\n`;
      msg += 'Do you want to overwrite it?'
      const answer = await utils.confirm(msg);
      if (!answer) {
        // Attractive message spacing.
        console.log();
        return;
      }
    }
    fs.writeFileSync(outPath, this.contents);
    msg = `\nA page has been written  to\n\t${outPath}\n`;
    console.log(msg);
  }
}



module.exports.Page = _Page;
