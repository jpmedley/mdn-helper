'use strict';

const fs = require('fs');

const OUT = 'out/';

function cleanOutput() {
  fs.readdir(OUT, (e, files) => {
    files.forEach(file => {
      fs.unlinkSync(OUT + file);
    })
  })
}

function getRealArguments(args) {
  let argString = args.join();
  let realArgs = argString.split('-');
  if (realArgs[0]=='') { realArgs.shift(); }
  for (let arg in realArgs) {
    if (realArgs[arg].endsWith(',')) {
      realArgs[arg] = realArgs[arg].slice(0, realArgs[arg].length -1);
    }
  }
  return realArgs;
}

module.exports.cleanOutput = cleanOutput;
module.exports.getRealArguments = getRealArguments;
module.exports.OUT = OUT;
