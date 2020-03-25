// // Copyright 2020 Google LLC
// //
// // Licensed under the Apache License, Version 2.0 (the "License");
// // you may not use this file except in compliance with the License.
// // You may obtain a copy of the License at
// //
// //     https://www.apache.org/licenses/LICENSE-2.0
// //
// // Unless required by applicable law or agreed to in writing, software
// // distributed under the License is distributed on an "AS IS" BASIS,
// // WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// // See the License for the specific language governing permissions and
// // limitations under the License.

// 'use strict';


// const assert = require('assert');

// const { DirectoryManager } = require('../directorymanager.js')
// const { initiateLogger } = require('../log.js');

// initiateLogger();

// let INTERFACE_SET = {};
// const IDL_FILES = '../idl/';
// const MEMBERS = [
//   "constructors",
//   "deleters",
//   "eventHandlers",
//   "getters",
//   "iterable",
//   "maplikeMethods",
//   "methods",
//   "namedGetters",
//   "namedSetters",
//   "properties",
//   "readOnlyProperties",
//   "readWriteProperties",
//   "setters",
//   "unnamedGetter",
//   "unnamedSetter"
// ];

// global.__Flags = require('../flags.js').FlagStatus('./idl/platform/runtime_enabled_features.json5');

// describe('Testing files', () => {

//   before(() => {
//     const dm = new DirectoryManager(IDL_FILES);
//     INTERFACE_SET = dm.interfaceSet;
//   });


//   describe('File smoke test', () => {
//     it('Smoke-tests against all real idl files', () => {
//       const interfaces = INTERFACE_SET.interfaces;
//       interfaces.forEach(interface_ => {

//       });
//     });
//   });

  
//   // describe('Member flags', () => {
//   //   it('Confirms that all flagged members return true for .flagged', () => {
//   //     const source = loadSource(FLAGGED_MEMBERS);
//   //     const id = new InterfaceData(source);
//   //     let foundIncorrect = {};
//   //     let passFail = MEMBERS.every(memberName => {
//   //       let member = id[memberName];
//   //       return member.every(elem => {
//   //         if (!elem.flagged) { foundIncorrect = `${memberName} ${JSON.stringify(elem)}`; }
//   //         return elem.flagged
//   //       });
//   //     });
//   //     assert.ok(passFail, foundIncorrect);
//   //   });
//   // }

// });