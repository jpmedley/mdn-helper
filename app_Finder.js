'use-strict';

const { Finder } = require('./finder.js');
const { printWelcome, update } = require('./utils.js');

printWelcome();
update();

const finder = new Finder();
finder.findAndShow(process.argv);
