'use strict';

const readline = require('readline');

const _commandLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function _closecommandLine() {
  _commandLine.close();
}

module.exports.closeCommandLine = _closeCommandLine;
module.exports.commandLine = _commandLine;
