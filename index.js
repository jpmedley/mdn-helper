'use strict';

// https://stackoverflow.com/questions/36712938/run-npm-scripts-synchronously

const create = require('./create.js');
const utils = require('./utils.js');

switch (process.argv[2]) {
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
	case 'create':
    create.create(process.argv);
		break;
	case 'help':
  default:
    console.log('Basic usage:');
    console.log('\tnode index.js [command] [arguments]');
    console.log('Commands:');
    console.log('\tcreate [-i interface] [-p] [-c] [-o] [-a[memberName pageType]] [-it]');
    console.log('\tclean');
    console.log('\thelp');
		process.exit();
}
