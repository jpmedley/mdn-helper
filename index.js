'use strict';

const { Burner } = require('./app_Burn.js');
const { Directory } = require('./app_Directory.js');
const { Manual } = require('./app_manual.js');
const { InterfaceData } = require('./idl.js');
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
  case 'burn':
    burnApp = new Burner();
    break;
  case 'clean':
    utils.cleanOutput()
    .then(() => { process.exit(); });
    break;
  case 'find':
    dirApp = new Directory();
    dirApp.findAndShow(realArguments[1]);
    break;
  case 'build':
    dirApp = new Directory();
    dirApp.findAndBuild(realArguments[1])
    .then((interfaces) => {
      const id = new InterfaceData(interfaces[0].path());
      const { Manual } = require('./app_manual.js');
      const manApp = new Manual(id.command);
      manApp.create();
    })
    break;
  case 'css':
  case 'header':
  case 'interface':
    const manApp = new Manual(realArguments);
    manApp.create();
    break;
  case 'help':
  default:
    utils.printHelp();
}
