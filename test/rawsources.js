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
const { FlagStatus, NO_FLAG } = require('../flags.js');
const { initiateLogger } = require('../log.js');
const { SourceRecord } = require('../rawsources.js');
const utils = require('../utils.js');


const TEST_IDL_FILES = './test/files/';
global.__Flags = FlagStatus(`${TEST_IDL_FILES}exp_flags.json5`);

initiateLogger();

const CONSTRUCTOR_NO_ARGS = `${TEST_IDL_FILES}constructor-noarguments.idl`;
const CONSTRUCTOR_ARGS = `${TEST_IDL_FILES}constructor-arguments.idl`;
const EVENT_HANDLERS = `${TEST_IDL_FILES}event-handlers.idl`;
const FLAG_INTERFACE_OT = `${TEST_IDL_FILES}flag-interface-ot.idl`;
const FLAG_INTERFACE_DT = `${TEST_IDL_FILES}flag-interface-dt.idl`;
const FLAG_STATUS_SHARED = `${TEST_IDL_FILES}flag-status-shared.idl`;
const INTERFACE_PARENT = `${TEST_IDL_FILES}interface-parent.idl`;
const INTERFACE_SECURE_CONTEXT = `${TEST_IDL_FILES}interface-securecontext.idl`;
const METHODS_BASIC  = `${TEST_IDL_FILES}methods-basic.idl`;
const METHODS_SYNC_ARGUMENTS = `${TEST_IDL_FILES}methods-synchronous.idl`;
const PROPERTIES_BASIC = `${TEST_IDL_FILES}properties-basic.idl`;
const PROPERTIES_DISTINGUISH = `${TEST_IDL_FILES}properties-distinguish.idl`;
const PROPERTIES_EVENTHANDLER = `${TEST_IDL_FILES}properties-eventhandler.idl`;
const PROPERTIES_MAPLIKE = `${TEST_IDL_FILES}properties-maplike.idl`;
const PROPERTIES_MAPLIKE_READONLY = `${TEST_IDL_FILES}properties-maplike-readonly.idl`;
const PROPERTIES_OTHER = `${TEST_IDL_FILES}properties-other.idl`;
const PROPERTIES_SETLIKE = `${TEST_IDL_FILES}properties-setlike.idl`;
const PROPERTIES_SETLIKE_READONLY = `${TEST_IDL_FILES}properties-setlike-readonly.idl`;
const SIMPLE_SOURCE = `${TEST_IDL_FILES}url-source.idl`;

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('SourceRecord', () => {
  describe('flagStatus', () => {
    it('Confirms origin trial for simple flag', () => {
      let source = loadSource(FLAG_INTERFACE_OT);
      const sr = new SourceRecord('otFlag', 'interface', { path: FLAG_INTERFACE_OT, sourceIdl: source });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'origintrial');
    });
    it('Confirms dev trial for simple flag', () => {
      let source =loadSource(FLAG_INTERFACE_DT);
      const sr = new SourceRecord('dtFlag', 'interface', { path: FLAG_INTERFACE_DT, sourceIdl: source });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'devtrial');
    })
  });

  describe('getAllMembers()', () => {
    it('Confirms that all records for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const record = sr.getAllMembers();
      assert.strictEqual(record.length, 2);
    })
  });

  describe('getBurnRecords', () => {
    it('Confirms that burn records contain proper constructor keys', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const sr = new SourceRecord('constructor', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
      const records = sr.getBurnRecords();
      const found = records.find((r) => {
        return r.name === 'ConstructorNoArgs';
      });
      assert.ok(found);
    });
  })

  describe('getConstructors', () => {
    it('Confirms that a constructor without arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const sr = new SourceRecord('constructor', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
      const record = sr.getConstructors();
      assert.strictEqual(record.length, 1);
    });
    it('Confirms that constructors with multiple arguments are processed', () => {
      const source = loadSource(CONSTRUCTOR_ARGS);
      const sr = new SourceRecord('constructor', 'interface', { path: CONSTRUCTOR_ARGS, sourceIdl: source });
      const record = sr.getConstructors();
      assert.strictEqual(record[0].arguments.length, 3);
    });
  })

  describe('getEvents', () => {
    it('Confirms that event callbacks are processed', () => {
      const source = loadSource(EVENT_HANDLERS);
      const sr = new SourceRecord('events', 'interface', { path: EVENT_HANDLERS, sourceIdl: source });
      const record = sr.getEvents();
      assert.strictEqual(record.length, 3);
    });
  })

  describe('getKeys()', () => {
    it('Confirms that all keys for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const record = sr.getKeys();
      assert.strictEqual(record.length, 3);
    });
  });

  describe('getMethods()', () => {
    it('Confirms that all basic members are counted', () => {
      const source = loadSource(METHODS_BASIC);
      const sr = new SourceRecord('methods-basic', 'interface', { path: METHODS_BASIC, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 2);
    });
    it('Confirms that methods with synchronous arguments are processed', () => {
      const source = loadSource(METHODS_SYNC_ARGUMENTS);
      const sr = new SourceRecord('methods-sync', 'interface', { path: METHODS_SYNC_ARGUMENTS, sourceIdl: source });
      const methods = sr.getMethods();
      let methodsWithArguments = 0;
      methods.forEach(method => {
        if (method.arguments && method.arguments.length > 0) { methodsWithArguments++; }
      });
      assert.strictEqual(methodsWithArguments, 1);
    });
    //     it('Confirms that the correct number of promise-based methods are returned', () => {
    //       const source = loadSource(METHOD_PROMISES);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods.length, 4);
    //     });
    //     it('Confirms that the correct number of synchronous methods are returned', () => {
    //       const source = loadSource(METHOD_SYNCHRONOUS);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods.length, 2);
    //     });
    //     it('Confirms that methods with multiple return types are processed', () => {
    //       const source = loadSource(METHOD_MULTI_RETURNS);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].arguments.length, 1);
    //     });
    //     it('Confirms that method.args returns the correct number of args, when present', () => {
    //       const source = loadSource(METHOD_ARGUMENTS_COUNT);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].arguments.length, 2);
    //     });
    //     it('Confirms that method.args equals 0 when there are no args present', () => {
    //       const source = loadSource(METHOD_NO_ARGUMENTS);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].arguments.length, 0);
    //     });
    //     it('Confirms that method.resolutions returns a value', () => {
    //       const source = loadSource(METHOD_PROMISE_RESOLUTION);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].resolution, "DOMString");
    //     });
    //     it('Confirms that method.resolutions returns "void"', () => {
    //       const source = loadSource(METHOD_PROMISE_VOID);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].resolution, "void");
    //     });
    //     it('Confirms that stringifier keywords are processed', () => {
    //       const source = loadSource(STRINGIFIER);
    //       const id = new InterfaceData(source);
    //       assert.strictEqual(id.methods[0].name, "toString");
    //     });
    //     it('Confirms that processing iterables doesn\'t add a false positive', () => {
    //       const source = loadSource(ITERABLE_SEQUENCE_ARG);
    //       const id = new InterfaceData(source);
    //       const found = id.methods.find(e => {
    //         return (e.name === "");
    //       });
    //       assert.ok(typeof found === "undefined");
    //     });
    //     it('Confirms that mutli-line comments donn\'t add false methods', () => {
    //       const source = loadSource(COMMENTS_MULTI_LINE);
    //       const id = new InterfaceData(source);
    //       const found = id.methods.find(e => {
    //         return (e.name === "");
    //       });
    //       assert.ok(typeof found === "undefined");
    //     });
    //     it('Confirms that return value with "?" is processed', () => {
    //       const source = loadSource(METHOD_OPTIONAL_RETURN);
    //       const id = new InterfaceData(source);
    //       const found = id.methods.find(e => {
    //         return (e.name === 'getContext');
    //       });
    //       assert.ok(found.returnType === 'OffscreenRenderingContext?');
    //     });
  });

  describe('getProperties()', () => {
    it('Confirms that all basic properties are counted', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const sr = new SourceRecord('properties-basic', 'interface', { path: PROPERTIES_BASIC, sourceIdl: source });
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 2);
    });
    it('Confirms that eventHandler is excluded', () => {
      const source = loadSource(PROPERTIES_EVENTHANDLER);
      const sr = new SourceRecord('properties-eh-excluded', 'interface', { path: PROPERTIES_EVENTHANDLER, sourceIdl: source });
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 2);
    });
    it('Confirms that return type is recorded', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const sr = new SourceRecord('properties-returnType', 'interface', { path: PROPERTIES_BASIC, sourceIdl: source});
      const properties = sr.getProperties();
      assert.strictEqual(properties[0].returnType, 'FontFaceLoadStatus');
    });
    it('Confirms that a false positive is avoided', () => {
      // A false positive is a method that contians the word 'attribute' within
      const source = loadSource(PROPERTIES_DISTINGUISH);
      const sr = new SourceRecord('properties-falsePlus', 'interface', { path: PROPERTIES_DISTINGUISH, sourceIdl: source});
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 1);
    });
    it('Confirms that array return types are returned', () => {
      const source = loadSource(PROPERTIES_OTHER);
      const sr = new SourceRecord('properties-array-return', 'interface', { path: PROPERTIES_OTHER, sourceIdl: source });
      const properties = sr.getProperties();
      const aProperty = properties.find((p) => {
        return p.returnType === 'FrozenArray<DOMPointReadOnly>';
      });
      assert.strictEqual(aProperty.name, 'polygon');
    });
    it('Confirms that variable return types are returned', () => {
      const source = loadSource(PROPERTIES_OTHER);
      const sr = new SourceRecord('properties-array-return', 'interface', { path: PROPERTIES_OTHER, sourceIdl: source });
      const properties = sr.getProperties();
      const aProperty = properties.find((p) => {
        return p.returnType === 'XRPlaneOrientation?';
      });
      assert.strictEqual(aProperty.name, 'orientation');
    });
  });

  describe('getUrls()', () => {
    it('Confirms that urls can be constructed', () => {
      const URL_BASE = 'https://developer.mozilla.org/en-US/docs/Web/API/';
      const URLS = [
        `${URL_BASE}PropertiesBasic`,
        `${URL_BASE}PropertiesBasic/status`,
        `${URL_BASE}PropertiesBasic/raw`
      ];

      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const urls = sr.getUrls();
      const isComplete = URLS.every((u) => {
        return urls.includes(u);
      });
      assert.ok(isComplete);
    });
  });

  describe('interfaceName', () => {
    it('Confirms that the interface name is returned from a simple IDL file', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
    });
    it('Confirms that the name of a child interface is returned', () => {
      const source = loadSource(INTERFACE_PARENT);
      const sr = new SourceRecord('parent-interface', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'InterfaceParent');
    })
  });

  describe('key', () => {
    it('Confirms that the key property returns a correct value', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('key', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
    });
  });

  describe('secureContext', () => {
    it('Confirms that secure context status is extracted from IDL', () => {
      const source = loadSource(INTERFACE_SECURE_CONTEXT);
      const sr = new SourceRecord('secure-context', 'interface', { path: INTERFACE_SECURE_CONTEXT, sourceIdl: source });
      assert.ok(sr.secureContext);
    });
  });
});