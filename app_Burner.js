'use-strict';

const { BurnerFactory } = require('./burner.js');
const { printWelcome, update } = require('./utils.js');

// global.__basedir = __dirname;

printWelcome();
update(process.argv);

const burner = BurnerFactory(process.argv);
burner.burn();
