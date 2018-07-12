'use strict';

const fs = require('fs');
const utils = require('./utils.js');

let dataManager;
let questionTemplates
const TEMPLATES = 'templates/';
const QUESTION_RE = /(\[\[([\w\-\_:]+)\]\])/gm;

function _writeFiles() {
  if (!fs.existsSync(utils.OUT)) { fs.mkdirSync(utils.OUT); }
  for (let m in dataManager.members) {
    let template = getTemplate(dataManager.members[m].type);
    let matches = template.match(QUESTION_RE);
    for (let match in matches) {
      let token;
      let answer;
      if (matches[match].startsWith('[[shared:')) {
        token = matches[match].slice(9, -2);
        answer = dataManager.shared[token];
        template = template.replace(matches[match], answer);
      } else {
        token = matches[match].slice(2, -2);
        answer = dataManager.members[m][token];
        template = template.replace(matches[match], answer);
      }
    }
    let outPath = utils.OUT + dataManager.shared.identifier + "_" + m + ".html"
    fs.writeFileSync(outPath, template);
  }
}

async function _promptQuestions() {
  let question;
  let q;

  const SHARED = `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\nYou will now be asked to provide answers that are shared among all the files to\nbe created.\n`;

  await _askQuestions(dataManager.shared, SHARED);
  for (let m in dataManager.members) {
    let NOT_SHARED = `\nQuestions for ${m}\n` + (`-`.repeat(80)) + `\nYou will now be asked to provide answers for the ${m} page.\n`;
    await _askQuestions(dataManager.members[m], NOT_SHARED);
  }
  utils.prompt.close();
}

async function _askQuestions(questions, intro) {
  if (questions.hasQuestions()) {
    // let item = questions.type;
    console.log(intro);
    for (let q in questions) {
      if (q == 'identifier') { continue; }
      if (questions[q] == '') {
        questions[q] = await _askQuestion(questionTemplates[q])
      }
    }
  } else {
    console.log("\nThere are no unanswered questions for this item.");
    console.log("-".repeat(80));
  }

}

function _askQuestion(questionTemplate) {
  let question = "\n" + questionTemplate.question;
  if (questionTemplate.default != '') {
    question += (" (" + questionTemplate.default + ")");
  }
  question += "\n";
  return new Promise((resolve, reject) => {
    utils.prompt.question(question, (answer) => {
      if (answer == '') {
        answer = questionTemplate.default;
      }
      resolve(answer);
    });
  });
}

function _loadQuestionTemplates() {
  const questionPath = TEMPLATES + "questions.json";
  const questionBuffer = fs.readFileSync(questionPath);
  questionTemplates = JSON.parse(questionBuffer.toString()).templates;
}

function _collectTokens() {
  if (!dataManager) { return; }
  for (let m in dataManager.members) {
    let template = getTemplate(dataManager.members[m].type);
    let matches = template.match(QUESTION_RE);
    for (let q in matches) {
      let key;
      if (matches[q].startsWith('[[shared:')) {
        let pieces = matches[q].split(':');
        key = pieces[1].slice(0,-2);
        if (!(key in dataManager.shared)) {
          dataManager.shared[key] = '';
        }
      } else {
        let subKey = matches[q].slice(2,-2);
        dataManager.members[m][subKey] = '';
      }
    }
    dataManager.members[m]['member'] = m;
  }
}

function getTemplate(named) {
  let templatePath = TEMPLATES + named.toLowerCase() + ".html";
  let templateContents = fs.readFileSync(templatePath);
  return templateContents.toString();
}

function _hasQuestions() {
  for (let m in this) {
    if (this[m] == '') {
      return true;
    }
  }
  return false;
}

function _buildDataManager(args) {
  const realArgs = utils.getRealArguments(args);
  dataManager = new Object();
  dataManager.shared = new Object();
  dataManager.members = new Object();
  realArgs.forEach((element) => {
    let argMembers = element.split(',');
    switch (argMembers[0]) {
      case 's':
      case 'css':
        dataManager.shared.selector = argMembers[1];
        dataManager.shared.identifier = argMembers[1];
        dataManager.shared.hasQuestions = _hasQuestions;
        dataManager.members.selector = new Object();
        dataManager.members.selector.type = "css";
        dataManager.members.selector.hasQuestions = _hasQuestions;
        break;
      case 'h':
      case 'header':
        dataManager.shared.header = argMembers[1];
        dataManager.shared.identifier = argMembers[1];
        dataManager.shared.hasQuestions = _hasQuestions;
        dataManager.members.header = new Object();
        dataManager.members.header.type = "header";
        dataManager.members.header.hasQuestions = _hasQuestions;
        break;
      case 'i':
      case 'interface':
        dataManager.shared.interface = argMembers[1];
        dataManager.shared.identifier = argMembers[1];
        dataManager.shared.hasQuestions = _hasQuestions;
        break;
      case 'p':
        dataManager.members.interface = new Object();
        dataManager.members.interface.type = "interface";
        dataManager.members.interface.hasQuestions = _hasQuestions;
        break;
      case 'c':
        dataManager.members.constructor = new Object();
        dataManager.members.constructor.type = "constructor";
        dataManager.members.constructor.hasQuestions = _hasQuestions;
        break;
      case 'o':
        dataManager.members.overview = new Object();
        dataManager.members.overview.type = "overview";
        dataManager.members.overview.hasQuestions = _hasQuestions;
        break;
      case 'a':
        let memberName;
        argMembers.forEach((element, index) => {
          switch (index) {
            case 0:
              break;
            default:
              let rem = index % 2;
              if (rem > 0) {
                memberName = element;
                dataManager.members[memberName] = new Object();
              } else {
                dataManager.members[memberName].type = element;
                dataManager.members[memberName].hasQuestions = _hasQuestions;
              }
          }
        })
        break;
      case 'it':
        const iterables = ['entries()', 'forEach()', 'keys()', 'values()'];
        iterables.forEach(iterable => {
          dataManager.members[iterable] = new Object();
          let type = iterable.slice(0,-2);
          dataManager.members[iterable].type = type;
          dataManager.members[iterable].hasQuestions = _hasQuestions;
        })
        break;
    }
  });
}

async function create(args) {
  // Ask if user needs an interface page. If no, remove from args.
  // Later merge with walker and ping the interface for the answer.
  _buildDataManager(args);
  _collectTokens();
  _loadQuestionTemplates();
  await _promptQuestions()
  _writeFiles();
}

module.exports.create = create;
