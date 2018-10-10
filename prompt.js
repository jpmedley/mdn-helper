'use strict';

const readline = require('readline');

const _prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function _closePrompt() {
  _prompt.close();
}

module.exports.closePrompt = _closePrompt;
module.exports.prompt = _prompt;
