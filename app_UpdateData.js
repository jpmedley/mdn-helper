'use strict';

const { printWelcome, update } = require('./utils.js');

printWelcome();
const updated = update(process.argv);
if (!updated) {
  console.log('No data update is currently needed.');
}
