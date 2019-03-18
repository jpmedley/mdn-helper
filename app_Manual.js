'use strict';

const { CLIBuilder } = require('./builder.js');
const { printWelcome } = require('./utils.js');

// global.__basedir = __dirname;

printWelcome();

const builder = new CLIBuilder({ args: process.argv });
builder.build();
