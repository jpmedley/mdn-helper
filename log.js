// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const config = require('config');
const winston = require('winston');

const utils = require('./utils.js');


global.__logger = {};
global.__loggerInitiated = false;

function _initiateLogger(name = '') {
  if (!global.__loggerInitiated) {
    global.__loggerInitiated = true;

    const logLevel = config.get('Application.logLevel');
    const console = new winston.transports.Console();
    global.__logger = winston.createLogger({
      level: logLevel,
      transports: [
        console
      ]
    });

    const logDirectory = utils.resolveHome(config.get('Application.loggingDirectory'));
    let logFileName = utils.makeFolder(logDirectory);
    logFileName += `${name}_${utils.today()}.log`

    const logOutput = config.get('Application.logOutput');
    logOutput.forEach(lo => {
      switch (lo) {
        case 'file':
          const fileTransport = new winston.transports.File({filename: logFileName});
          global.__logger.add(fileTransport);
          break;
      }
    });
    if (!logOutput.includes('console')) {
      global.__logger.remove(console);
    }
  }
}

module.exports.initiateLogger = _initiateLogger;
