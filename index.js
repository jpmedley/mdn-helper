'use strict';

// https://stackoverflow.com/questions/36712938/run-npm-scripts-synchronously

const create = require('./create.js');
const utils = require('./utils.js');

printWelcome();
let command = process.argv[2];
if (process.argv[3]) {
  command += (" " + process.argv[3]);
}

switch (command) {
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'create -h':
  case 'create --header':
  case 'create -i':
  case 'create --interface':
  case 'create -s':
  case 'create --css':
    create.create(process.argv);
		break;
	case 'help':
  default:
    console.log('Basic usage:');
    console.log('\tnode index.js [command] [arguments]');
    console.log('Commands:');
    console.log('\tclean');
    console.log('\tcreate -h headerName');
    console.log('\tcreate -i interface [-c] [-o] [-a memberName1 pageType \n\t\t[[memberName2 pageType] ... [memberNameN pageType]]] [-it]');
    console.log(('\tcreate -s cssSelectorName'));
    console.log('\thelp');
		process.exit();
}

function printWelcome() {
  console.clear();
  console.log("=".repeat(80));
  console.log(" ".repeat(30) + "Welcome to mdn-helper" + " ".repeat(29));
  console.log("=".repeat(80));
}
