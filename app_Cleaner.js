'use-strict';

const { Cleaner } = require('./cleaner.js');
const { printWelcome } = require('./utils.js');

printWelcome();

const cleaner = new Cleaner();
cleaner.clean();
