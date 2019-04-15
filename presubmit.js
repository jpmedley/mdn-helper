'use strict';

const config = require('config');

if (config.get('Application.test.active')) {
  throw new Error('You forgot to turn off testing.');
}
if (config.get('Application.test.useTestFiles')) {
  throw new Error('You forgot to turn off testing.');
}