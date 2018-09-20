'use strict';

const app = require('./app.js');
const create = require('./create.js');
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
    create.css(realArguments);
    break;
  case 'header':
    create.header(realArguments);
    break;
  case 'help':
    utils.printHelp();
    break;
  case 'interface':
    create.interface(realArguments);
    break;
  case 'test':
    app.interface(realArguments);
    break;
  default:
    utils.printHelp();
}
