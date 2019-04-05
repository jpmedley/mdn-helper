'use strict';

const { CLIBuilder } = require('./builder.js');
const { printWelcome } = require('./utils.js');

printWelcome();

const builder = new CLIBuilder({ args: process.argv });
builder.build();
