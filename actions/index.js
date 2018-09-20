'use strict';

require("fs").readdirSync(__dirname).forEach(file => {
  console.log(file);
  var name = file.replace('.js', '');
  module.exports[name] = require("./" + file);
  if (file == 'index.js') { return; }
  if (!module.exports[name].run) {
    throw new Error('Module named ' + file + ' does not contain a run() method.');
  }
})
