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

global.__commandName = 'test';

const assert = require('assert');
const { IDLError } = require('../errors.js');
const { FlagStatus, NO_FLAG } = require('../flags.js');
const { initiateLogger } = require('../log.js');
const { CallbackSourceRecord } = require('../rawsources.js');
const utils = require('../utils.js');


const TEST_IDL_FILES = './test/files/';
global.__Flags = FlagStatus(`${TEST_IDL_FILES}exp_flags.json5`);

initiateLogger();

const CALLBACK = `${TEST_IDL_FILES}callback.idl`;
const CALLBACK_COMPLEX = `${TEST_IDL_FILES}callback-complext.idl`;
const CALLBACK_PROMISE = `${TEST_IDL_FILES}callback-promise.idl`;

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('CallbackSourceRecord', () => {

  describe('Callback interfaces', () => {
    it('Confirms that a simple callback is processed without errors', () => {
      const source = loadSource(CALLBACK);
      let foundErr;
      try {
        const sr = new CallbackSourceRecord('callback', 'callback', { path: CALLBACK, sourceIdl: source });
      } catch (error) {
        foundErr = error
        console.log(error);
      }
      assert.ok(!(foundErr instanceof IDLError));
    });
  });

  // // describe('flagStatus', () => {
  // //   it('Confirms origin trial for simple flag', () => {
  // //   });
  // //   it('Confirms dev trial for simple flag', () => {
  // //   })
  // // });

  // describe('getAllMembers()', () => {
  //   it('Confirms that all records for a source IDL are returned', () => {
  //     const source = loadSource(SIMPLE_SOURCE);
  //     const sr = new CallbackSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     const record = sr.getAllMembers();
  //     assert.strictEqual(record.length, 2);
  //   })
  // });

  // describe('getBurnRecords', () => {
  //   it('Confirms that burn records contain proper constructor keys', () => {
  //     const source = loadSource(CONSTRUCTOR_NO_ARGS);
  //     const sr = new CallbackSourceRecord('constructor', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
  //     const records = sr.getBurnRecords();
  //     const found = records.find((r) => {
  //       return r.name === 'ConstructorNoArgs';
  //     });
  //     assert.ok(found);
  //   });
  // })

  // describe('getKeys()', () => {
  //   it('Confirms that all keys for a source IDL are returned', () => {
  //     const source = loadSource(SIMPLE_SOURCE);
  //     const sr = new CallbackSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     const record = sr.getKeys();
  //     assert.strictEqual(record.length, 3);
  //   });
  // });


  // describe('getUrls()', () => {
  //   it('Confirms that urls can be constructed', () => {
  //     const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';
  //     const URLS = [
  //       `${URL_BASE}PropertiesBasic`,
  //       `${URL_BASE}PropertiesBasic/status`,
  //       `${URL_BASE}PropertiesBasic/raw`
  //     ];

  //     const source = loadSource(SIMPLE_SOURCE);
  //     const sr = new CallbackSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     const urls = sr.getUrls();
  //     const isComplete = URLS.every((u) => {
  //       return urls.includes(u);
  //     });
  //     assert.ok(isComplete);
  //   });
  // });

  // // describe('inDevTrial', () => {
  // //   it('Confirms true is returned for interface in a dev trial', () => {
  // //   });
  // //   it('Confirms false is returned for a stable interface', () => {
  // //   });
  // //   it('Confirms false is returned for interface in an origin trial', () => {
  // //   });
  // // });

  // describe('interfaceName', () => {
  //   it('Confirms that the structure name is returned from a simple IDL file', () => {
  //     const source = loadSource(SIMPLE_SOURCE);
  //     const sr = new CallbackSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
  //   });
  //   it('Confirms that the name of a child interface is returned', () => {
  //     const source = loadSource(INTERFACE_PARENT);
  //     const sr = new CallbackSourceRecord('parent-interface', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     assert.strictEqual(sr.interfaceName, 'InterfaceParent');
  //   });
  //   it('Confirms that structure name is returned from a simple namespace file', () => {
  //     const source = loadSource(NAMESPACE_SIMPLE);
  //     const sr = new CallbackSourceRecord('namespace', 'namespace', { path: NAMESPACE_SIMPLE, sourceIdl: source });
  //     assert.strictEqual(sr.interfaceName, 'NamespaceName');
  //   });
  //   it('Confirms that structure name is returned from a simple namespace file', () => {
  //     const source = loadSource(NAMESPACE_PARTIAL);
  //     const sr = new CallbackSourceRecord('namespace', 'namespace', { path: NAMESPACE_PARTIAL, sourceIdl: source });
  //     assert.strictEqual(sr.interfaceName, 'PartialNamespaceName');
  //   });
  // });

  // // describe('inOriginTrial', () => {
  // //   it('Confirms true is returned for interface in an origin trial', () => {
  // //   });
  // //   it('Confirms false is returned for a stable interface', () => {
  // //   });
  // //   it('Confirms false is returned for interface in a dev trial', () => {
  // //   });
  // // });

  // describe('key', () => {
  //   it('Confirms that the key property returns a correct value', () => {
  //     const source = loadSource(SIMPLE_SOURCE);
  //     const sr = new CallbackSourceRecord('key', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
  //     assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
  //   });
  // });

  // // describe('getSecureContext()', () => {
  // //   it('Confirms that secure context status is extracted from IDL', () => {
  // //   });
  // // });
});