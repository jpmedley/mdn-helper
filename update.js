'use strict';

const utils = require('./utils.js');

const updated = utils.update(process.argv);
if (!updated) {
  console.log('No data update is currently needed.');
}
