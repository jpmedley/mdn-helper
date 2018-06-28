'use strict';
// mdn create [-i interface] [-c] [-a memberName pageType]

let fs = require('fs');

let dataManager;
let questionTemplates
const TEMPLATES = 'templates/';

switch (process.argv[2]) {
	case 'create':
		process.argv.shift();
		process.argv.shift();
		process.argv.shift();
		// Ask if user needs an interface page. If no, remove from args.
		// Later merge with walker and ping the interface for the answer.
		buildDataManager(process.argv);
    collectTokens();
    loadQuestionTemplates();
    askQuestions();
		break;
	case 'help':
  default:
		console.log('Syntax: node mdn.js create [-i interface] [-c] [[-a memberName pageType]n]');
		break;
}

function askQuestions() {
  console.log(dataManager);
  console.log("==================================================");
  console.log(questionTemplates);
  for (let q in dataManager.shared) {
    console.log(q);
  }
}

function loadQuestionTemplates() {
  const questionPath = TEMPLATES + "questions.json";
  const questionBuffer = fs.readFileSync(questionPath);
  questionTemplates = JSON.parse(questionBuffer.toString());
}

function collectTokens() {
  if (!dataManager) { return; }
  const QUESTION_RE = /(\[\[([\w\-\_:]+)\]\])/gm;
  for (let m in dataManager.members) {
    let templatePath = TEMPLATES + dataManager.members[m].type + ".html"
    let templateContents = fs.readFileSync(templatePath);
    let matches = templateContents.toString().match(QUESTION_RE);
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
        console.log(m, ": ", subKey);
      }
    }
  }
}

function getRealArguments(args) {
  let argString = args.join();
  let realArgs = argString.split('-');
  if (realArgs[0]=='') { realArgs.shift(); }
  for (let arg in realArgs) {
    if (realArgs[arg].endsWith(',')) {
      realArgs[arg] = realArgs[arg].slice(0, realArgs[arg].length -1);
    }
  }
  return realArgs;
}

function buildDataManager(args) {
  const realArgs = getRealArguments(args);
  dataManager = new Object();
  dataManager.shared = new Object();
  dataManager.members = new Object();
  realArgs.forEach((element) => {
    let argMembers = element.split(',');
    switch (argMembers[0]) {
      case 'i':
        dataManager.shared.interface = argMembers[1];
        dataManager.members.interface = new Object();
        dataManager.members.interface.type = "Interface";
        break;
      case 'c':
        dataManager.members.constructor = new Object();
        dataManager.members.constructor.type = "constructor";
        break;
      case 'o':
        dataManager.members.overview = new Object();
        dataManager.members.overview.type = "overview";
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
              }
          }
        })
        break;
    }
  });
}
