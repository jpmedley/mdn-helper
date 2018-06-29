'use strict';

const create = require('./create.js');
const utils = require('./utils.js');

switch (process.argv[2]) {
  case 'clean':
    utils.cleanOutput();
    process.exit();
	case 'create':
    create.create(process.argv)
		break;
	case 'help':
  default:
    console.log('Basic usage:');
    console.log('\tnode index.js [command] [arguments]');
    console.log('Commands:');
    console.log('\tcreate [-i interface] [-p] [-c] [-o] [-a[memberName pageType]]');
    console.log('\tclean');
    console.log('\thelp');
		process.exit();
}
