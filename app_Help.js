'use-strict';

const { printHelp, printWelcome } = require('./utils.js');

global.__basedir = __dirname;

printWelcome();
printHelp();
