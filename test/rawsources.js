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

global.__Flags = FlagStatus('./test/files/exp_flags.json5');

initiateLogger();

const FLAG_IDL = '[\n  RuntimeEnabled=RTEExperimental\n] interface InterfaceFlagOT {\n  readonly attribute FontFaceSetLoadStatus status;\n};';

const CONSTRUCTOR_NO_ARGS = './test/files/constructor-noarguments.idl';
const CONSTRUCTOR_ARGS = './test/files/constructor-arguments.idl';
const INTERFACE_PARENT = './test/files/interface-parent.idl';
const METHODS_BASIC  = './test/files/methods-basic.idl';
const METHODS_SYNC_ARGUMENTS = './test/files/methods-synchronous.idl';
const PROPERTIES_BASIC = './test/files/properties-basic.idl';
const PROPERTIES_DISTINGUISH = './test/files/properties-distinguish.idl';
const PROPERTIES_EVENTHANDLER = './test/files/properties-eventhandler.idl';
const PROPERTIES_MAPLIKE = './test/files/properties-maplike.idl';
const PROPERTIES_MAPLIKE_READONLY = './test/files/properties-maplike-readonly.idl';
const PROPERTIES_OTHER = './test/files/properties-other.idl';
const PROPERTIES_SETLIKE = './test/files/properties-setlike.idl';
const PROPERTIES_SETLIKE_READONLY = './test/files/properties-setlike-readonly.idl';
const SIMPLE_SOURCE = './test/files/url-source.idl';

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('SourceRecord', () => {
  describe('flagStatus', () => {
    it('Confirms that a flag\'s status correctly returned', () => {
      const sr = new SourceRecord('interfaceFlagOT', 'interface', {
        path: 'some/fake/path.idl',
        sourceIdl: FLAG_IDL
      });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'devtrial');
    });
  });

  describe('getAllIds()', () => {
    it('Confirms that all records for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const record = sr.getAllIds();
      assert.strictEqual(record.length, 2);
    })
  });

  describe('getBurnRecords', () => {
    it('Confirms that burn records contain proper constructor keys', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const sr = new SourceRecord('constructor', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
      const records = sr.getBurnRecords();
      const found = records.find((r) => {
        return r.name === 'ConstructorNoArgs.ConstructorNoArgs';
      });
      console.log(found);
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
});