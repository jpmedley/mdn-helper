'use strict';

const config = require('config');

if (config.get('Application.test')) {
  throw new Error('You forgot to turn off testing.');
}
