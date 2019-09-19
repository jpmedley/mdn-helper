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

const { BCD } = require('./bcd.js');
const config = require('config');
const fs = require('fs');
const { IDLFileSet } = require('./idlfileset.js');
const { InterfaceData } = require('./interfacedata.js');
const { getOutputFile, OUT, update } = require('./utils.js');

global._bcd = new BCD();
global.__Flags = require('./flags.js').FlagStatus('./idl/platform/runtime_enabled_features.json5');

update();
const idlfileset = new IDLFileSet('idl/', {
  experimental: true,
  originTrial: true
});
const allMethods = [];
const files = idlfileset.files;
for (let f of files) {
  const id = new InterfaceData(f, {
    experimental: true,
    originTrial: true
  });
  const methods = id.methods;
  let currentMethods = [];
  if (methods) {
    for (let m of methods) {
      switch (m.type) {
        case 'operation':
          if (m.body) {
            if (m.body.name) {
              let qualifiedName = `${id.name}.${m.body.name.escaped}()`;
              currentMethods.push(qualifiedName);
            }
          } else if (m.stringifier) {
            //Continue onward
          } 
          break;
        default:
          throw new Error(`Unrecognized: ${m.type}`);
      }
    }
  }
  currentMethods.sort();
  allMethods.push(...currentMethods);
}
allMethods.sort();
const fd = getOutputFile(`${OUT}methods.txt`);
for (let a of allMethods) {
  fs.appendFileSync(fd, `${a}\n`);
}
fs.closeSync(fd);