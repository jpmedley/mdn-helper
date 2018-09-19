'use strict';

require("fs").readdirSync(__dirname).forEach(file => {
  var name = file.replace('.js', '');
  module.exports[name] = require("./" + file);
  if (!module.exports[name].run) {
    throw new Error('Module named ' + file + ' does not contain a run() method.');
  }
})
