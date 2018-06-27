'use strict';
// mdn create [-i interface] [-c] [-a memberName pageType]

var creationMaster;

const TEMPLATES = 'templates/';

switch (process.argv[2]) {
	case 'create':
		process.argv.shift();
		process.argv.shift();
		process.argv.shift();
		// Ask if user needs an interface page. If no, remove from args.
		// Later merge with walker and ping the interface for the answer.

		getCreationMaster(process.argv);
		break;
	case 'list':
		//
		break;
	case 'help':
  default:
		console.log('Syntax: node mdn.js create [-i interface] [-c] [[-a memberName pageType]n]');
		break;
}

function getCreationMaster(args) {
  let argString = args.join();
  const realArgs = argString.split('-');
  creationMaster = new Object();
  creationMaster.shared = new Object();
  realArgs.forEach((element) => {
    let argMembers = element.split(',');
    switch (argMembers[0]) {
      case 'i':
        creationMaster.shared.interface = argMembers[1];
        creationMaster.interface = new Object();
        creationMaster.interface.type = "interface";
        break;
      case 'c':
        creationMaster.constructor = new Object();
        creationMaster.constructor.type = "constructor";
        break;
      case 'a':
        let memberName;
        argMembers.forEach((element, index) => {
          switch (index) {
            case 0:
              break;
            default:
              let rem = index % 2;
              if (rem > 0) {
                memberName = element;
                creationMaster[memberName] = new Object();
              } else {
                creationMaster[memberName].type = element;
              }
          }
        })
        break;
    }
  })

}
