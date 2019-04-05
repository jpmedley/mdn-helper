'use strict';

const { OUT, today } = require('./utils.js');
const winston = require('winston');

function _initiateLogger() {
  global.__logger = winston.createLogger();
}

module.exports.initiateLogger = _initiateLogger;
