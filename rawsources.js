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
  #type
  #sources = new Array();

  constructor(name, type, options) {
    this.#name = name;
    this.#type = type;
    this.add(options.path, options.content);
  }

  add(path, content) {
    let source = {
      path: path,
      content: content
    }
    this.#sources.push(source);
  }

  get name() {
    return this.#name;
  }

  get sources() {
    return this.#sources;
  }

  get type() {
    return this.#type;
  }
}

module.exports.SourceRecord = SourceRecord;