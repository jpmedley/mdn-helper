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

// This module exists to export an InterfaceSet() instance to a client
// application. Within the architecture of this app, getting an 
// InterfaceSet() requires instantiating DirectoryManager() and calling
// one of its properties. This is bad design on my part and makes
// particularly little sense in the contet of a client app. This
// wrapper is the first step toward correction. 

const utils = require('./utils.js');

const { DirectoryManager } = require('./directorymanager.js');

class _InterfaceCollection extends DirectoryManager {
  constructor() {
    super(`${utils.APP_ROOT}/idl/`);
  }
}

module.exports.InterfaceCollection = _InterfaceCollection;