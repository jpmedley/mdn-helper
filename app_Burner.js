'use-strict';

const { BurnerFactory } = require('./burner.js');
const { OUT, printWelcome, update, today } = require('./utils.js');
const { initiateLogger } = require('./log.js');

initiateLogger();
printWelcome();
update();

const burner = BurnerFactory(process.argv);
burner.burn();
