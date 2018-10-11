'use strict';

const da = require('./app_Directory.js');
const dm = require('./app_manual.js');
const idl = require('./idl.js');
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

let dirApp;
switch (realArguments[0]) {
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'find':
    dirApp = new da.Directory();
    dirApp.findAndShow(realArguments[1]);
    break;
  case 'build':
    dirApp = new da.Directory();
    dirApp.findAndBuild(realArguments[1])
    .then((interfaces) => {
      const id = new idl.InterfaceData(interfaces[0].path());
      const dm = require('./app_manual.js');
      const manApp = new dm.Manual(id.command);
      manApp.create();
    })
    break;
  case 'css':
  case 'header':
  case 'interface':
    const manApp = new dm.Manual(realArguments);
    manApp.create();
    break;
  case 'help':
  default:
    utils.printHelp();
}
