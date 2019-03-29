'use strict';

const { OUT, today } = require('./utils.js');
const winston = require('winston');

const _logger = winston.createLogger();

function _getLogger(options) {
  const fileTransport = new winston.transports.File({
    filename: `${OUT}${options.type}${today()}.log`
  });
  _logger.add(fileTransport);
  return _logger;
}

module.exports.getLogger = _getLogger;
