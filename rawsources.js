// Copyright 2022 Google LLC
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

const fs = require('fs');

const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

class SourceRecord {
  #name
  #sources = new Map();
  #type
  constructor(source, options) {
    this.#sources.set(options.path, source);
    this.#name = options.name;
    this.type = options.type;
  }

  get sources() {
    return this.#sources;
  }

  push(source, path) {
    if(this.#sources.has(path)) { return; }
    this.#sources.set(path, source);
  }
}

module.exports.SourceRecord = SourceRecord;