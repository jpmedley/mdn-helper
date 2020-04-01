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

const winston = require('winston');

const utils = require('./utils.js');

function _initiateLogger(name = '') {
  if (!global.__logger) {
    let fileName = utils.makeOutputFolder(`${name}_${utils.today()}`);
    fileName += `${name}_${utils.today()}.log`

    global.__logger = winston.createLogger({
      transports: [
        new winston.transports.File({ filename: fileName})
      ]
    });
  }
}

module.exports.initiateLogger = _initiateLogger;
