'use-strict';

const { BurnerFactory } = require('./burner.js');
const { OUT, printWelcome, update, today } = require('./utils.js');
const { getLogger } = require('./log.js');

global.__logger = getLogger({
  type: `burn_${process.argv[2]}`
});

printWelcome();
update(process.argv);

const burner = BurnerFactory(process.argv);
burner.burn();
