'use strict';

const app = require('./app.js');
const utils = require('./utils.js');

utils.printWelcome();

let realArguments;
try {
  realArguments = utils.getRealArguments(process.argv);
}
catch(e) {
  console.error(e.message);
  utils.printHelp();
  process.exit(1);
}

switch (realArguments[0]) {
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'css':
  case 'header':
  case 'interface':
    app.create(realArguments);
    break;
  case 'help':
  default:
    utils.printHelp();
}
