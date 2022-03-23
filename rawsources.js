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

const { FlagStatus } = require('./flags.js');
const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

global.__Flags = FlagStatus();

class SourceRecord {
  #name
  #runtimeFlag
  #sources = new Array();
  #type

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

  get flag() {
    const RUNTIME_ENABLED_RE = /RuntimeEnabled\s*=\s*(\w*)/;
    const matches = this.#sources[0].content.match(RUNTIME_ENABLED_RE);
    if (matches) {
      return matches[1].trim();
    }
  }

  get flagStatus() {
    if (!this.#runtimeFlag) {
      const flag = this.flag;
      if (flag) {
        this.#runtimeFlag = global.__Flags.getHighestResolvedStatus(flag);
      }
    }
    return this.#runtimeFlag;
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