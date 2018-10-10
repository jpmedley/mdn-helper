'use strict';

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

let app_;
switch (realArguments[0]) {
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'find':
    const da = require('./app_Directory.js');
    app_ = new da.Directory();
    app_.find(realArguments[1]);
    // app.find(realArguments[1]);
    break;
  case 'css':
  case 'header':
  case 'interface':
    const dm = require('./app_manual.js');
    app_ = new dm.Manual(realArguments);
    app_.create()
    // app.create(realArguments);
    break;
  case 'help':
  default:
    utils.printHelp();
}
