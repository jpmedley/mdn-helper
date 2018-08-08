'use strict';

const fs = require('fs');
const utils = require('./utils.js');

const DONT_ASK = 'Don\'t ask.';
const NO_ANSWER = '';
const QUESTIONS_FILE = utils.getConfig('questionsFile');
const QUESTION_RE = /(\[\[([\w\-\_:]+)\]\])/gm;
const TEMPLATES = 'templates/';

let dataManager;
let questionTemplates;
let pageData = new Array();
let sharedQuestions = new Object();
sharedQuestions.hasQuestions = _hasQuestions;

function _css(args) {
  create(args);
}

function _header(args) {
  create(args);
}

function _interface(args) {
  create(args);
}

function _writeFiles() {
  for (let page in pageData) {
    let template = getTemplate(pageData[page].type);
    const matches = template.match(QUESTION_RE);
    for (let match in matches) {
      let token;
      let answer;
      if (matches[match].startsWith('[[shared:')) {
        token = matches[match].slice(9, -2);
        if (sharedQuestions[token] == DONT_ASK) { continue; }
        if (sharedQuestions[token] == NO_ANSWER) { continue; }
        answer = sharedQuestions[token];
        template = template.replace(matches[match], answer);
      } else {
        token = matches[match].slice(2, -2);
        if (pageData[page].questions[token] == DONT_ASK) { continue; }
        if (pageData[page].questions[token] == NO_ANSWER) { continue; }
        answer = pageData[page].questions[token];
        template = template.replace(matches[match], answer);
      }
    }
    let outPath = utils.OUT + sharedQuestions.interface + "_" + pageData[page].name + "_" + pageData[page].type + ".html";
    fs.writeFileSync(outPath, template);
  }
}

async function _promptQuestions() {
  let question;
  let q;

  const SHARED = `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\nYou will now be asked questions for answers that are shared\namong all the files to be created.\n`;

  // pageData
  await _askQuestions(sharedQuestions, SHARED);
  for (let m in pageData) {
    const pageName = pageData[m].name + " " + pageData[m].type;
    let NOT_SHARED = `\nQuestions for the ${pageName} page\n` + (`-`.repeat(80)) + `\nYou will now be asked to provide answers for the ${pageName} page.\n`;
    await _askQuestions(pageData[m].questions, NOT_SHARED);
  }
  utils.prompt.close();
}

async function _askQuestions(questionSet, intro) {
  if (questionSet.hasQuestions()) {
    console.log(intro);
  } else {
    console.log(intro);
    console.log("\nThis page can be created with the answers alread provided. Moving on.");
    console.log("-".repeat(80));
    return;
  }
  for (let question in questionSet) {
    if (questionSet[question] == _hasQuestions) { continue; }
    if (questionSet[question] == 'identifer') { continue; }

    if (questionSet[question] == NO_ANSWER) {
      if (questionSet[question].skip) {
        questionSet[question] = DONT_ASK;
        continue;
      }
      questionSet[question] = await _askQuestion(questionTemplates[question]);
    }
  }
}

function _askQuestion(questionTemplate) {
  let question = "\n" + questionTemplate.question;
  if (questionTemplate.default != NO_ANSWER) {
    question += (" (" + questionTemplate.default + ")");
  }
  question += "\n";
  return new Promise((resolve, reject) => {
    utils.prompt.question(question, (answer) => {
      if (answer == '') { answer = questionTemplate.default; }
      resolve(answer);
    });
  });
}

function _loadQuestionTemplates() {
  // const questionsFileName = config.get('Application.questionsFile');
  // const questionPath = TEMPLATES + "questions.json";
  const questionPath = TEMPLATES + QUESTIONS_FILE
  const questionBuffer = fs.readFileSync(questionPath);
  questionTemplates = JSON.parse(questionBuffer.toString()).templates;
}

function _collectTokens() {
  for (let p in pageData) {
    let template = getTemplate(pageData[p].type);
    let qTokens = template.match(QUESTION_RE);
    pageData[p].questions = new Object();
    pageData[p].questions.hasQuestions  = _hasQuestions;
    for (let t in qTokens) {
      let key;
      if (qTokens[t].startsWith('[[shared:')) {
        let pieces = qTokens[t].split(':');
        key = pieces[1].slice(0,-2);
        if (!(key in sharedQuestions)) {
          sharedQuestions[key] = '';
        }
      } else {
        key = qTokens[t].slice(2,-2);
        if (!(key in pageData[p].questions)) {
          pageData[p].questions[key] = '';
        }
      }
    }
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

function _getPageDataObject(args) {
  let parentPages = ["header","interface"];
  let parentType = args[0];

  // Add space for interface or header name to sharedQuestions,
  //  and remove it from args.
  sharedQuestions[parentType] = '';
  args.shift();

  // Add interface or header name to sharedQuestions,
  //  and remove it from args.
  let argMembers = args[0].split(',');
  sharedQuestions[parentType] = argMembers[1];
  args.shift();

  // Process remaining arguments.
  args.forEach((arg, index, args) => {
    let argMembers = arg.split(',');
    let page = new Object();
    page.type = _resolveType(argMembers[0])
    page.name = argMembers[1];
    pageData.push(page);
  });
}

function _resolveType(type) {
  let types = { "c":"constructor", "constructor":"constructor", "d": "directive", "directive": "directive", "h":"header", "header":"header", "i":"interface", "interface":"interface", "m":"method", "method":"method", "o":"overview", "overview":"overview", "p":"property", "property":"property", "s": "css", "css": "css"}
  return types[type];
}

async function create(args) {
  _getPageDataObject(args);
  _collectTokens();
  _loadQuestionTemplates();
  await _promptQuestions()
  _writeFiles();
}

module.exports.css = _css;
module.exports.header = _header;
module.exports.interface = _interface;
