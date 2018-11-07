'use strict';

// Actions files should contain:
// * A function with the interface:
//   run(currentPage, question)
//
// The run() function should:
// * replace question.answer with modified contents.

require("fs").readdirSync(__dirname).forEach(file => {
  var name = file.replace('.js', '');
  module.exports[name] = require("./" + file);
  if (file == 'index.js') { return; }
  if (!module.exports[name].run) {
    throw new Error('Module named ' + file + ' does not contain a run() method.');
  }
})
