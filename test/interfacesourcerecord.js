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
const { InterfaceSourceRecord } = require('../rawsources.js');
const utils = require('../utils.js');


const TEST_IDL_FILES = './test/files/';
global.__Flags = FlagStatus(`${TEST_IDL_FILES}exp_flags.json5`);

initiateLogger();

const CONSTRUCTOR_ARGS = `${TEST_IDL_FILES}constructor-arguments.idl`;
const CONSTRUCTOR_COMPLEX_ARG = `${TEST_IDL_FILES}constructor-complex-argument.idl`;
const CONSTRUCTOR_NO_ARGS = `${TEST_IDL_FILES}constructor-noarguments.idl`;
const DELETERS = `${TEST_IDL_FILES}all-deleters.idl`;
const EVENT_HANDLERS = `${TEST_IDL_FILES}event-handlers.idl`;
const FLAG_INLINE_OT = `${TEST_IDL_FILES}flag-inline-ot.idl`;
const FLAG_INTERFACE_OT = `${TEST_IDL_FILES}flag-interface-ot.idl`;
const FLAG_INTERFACE_DT = `${TEST_IDL_FILES}flag-interface-dt.idl`;
const FLAG_STATUS_SHARED = `${TEST_IDL_FILES}flag-status-shared.idl`;
const GETTERS_BOTH = `${TEST_IDL_FILES}getters-both.idl`;
const GETTERS_SIMPLE_NAMED_ONLY = `${TEST_IDL_FILES}getters-simple-named-only.idl`;
const GETTERS_COMPLEX_NAMED_ONLY = `${TEST_IDL_FILES}getters-complex-named-only.idl`;
const GETTERS_RETURN_VAL = `${TEST_IDL_FILES}getters-return-val.idl`;
const GETTERS_UNNAMED_ONLY = `${TEST_IDL_FILES}getters-unnamed-only.idl`;
const IN_DEV_TRIAL = `${TEST_IDL_FILES}in-dev-trial.idl`;
const IN_ORIGIN_TRIAL = `${TEST_IDL_FILES}in-origin-trial.idl`;
const INTERFACE_CALLBACK = `${TEST_IDL_FILES}interface-callback.idl`;
const INTERFACE_MIXIN = `${TEST_IDL_FILES}mixin.idl`;
const INTERFACE_PARENT = `${TEST_IDL_FILES}interface-parent.idl`;
const INTERFACE_PARTIAL = `${TEST_IDL_FILES}interface-partial.idl`;
const INTERFACE_SECURE_CONTEXT = `${TEST_IDL_FILES}interface-securecontext.idl`;
const INTERFACE_STABLE = `${TEST_IDL_FILES}interface-rte-stable.idl`;
const INTERFACE_STANDARD = `${TEST_IDL_FILES}burnable.idl`;
const ITERABLE_MULTI_ARG_SEQ = `${TEST_IDL_FILES}iterable-multi-arg-sequence.idl`;
const ITERABLE_MULTI_ARG = `${TEST_IDL_FILES}iterable-multi-arg.idl`;
const ITERABLE_ONE_ARG = `${TEST_IDL_FILES}iterable-one-arg.idl`;
const ITERABLE_SEQUENCE_ARG = `${TEST_IDL_FILES}iterable-sequence-arg.idl`;
const METHODS_BASIC  = `${TEST_IDL_FILES}methods-basic.idl`;
const METHODS_SYNC_ARGUMENTS = `${TEST_IDL_FILES}methods-synchronous.idl`;
const MIXIN_NO_INCLUDES = `${TEST_IDL_FILES}mixin-no-includes.idl`;
const NAMESPACE_SIMPLE = `${TEST_IDL_FILES}namespace.idl`;
const NAMESPACE_PARTIAL = `${TEST_IDL_FILES}namespace-partial.idl`;
const NO_DELETERS = `${TEST_IDL_FILES}no-deleters.idl`;
const NO_EVENTHANDLERS = `${TEST_IDL_FILES}no-event-handlers.idl`;
const NO_ITERABLE = `${TEST_IDL_FILES}no-iterable.idl`;
const INTERFACE_MIXIN_INCLUDES = `${TEST_IDL_FILES}mixin-includes.idl`;
const PROPERTIES_BASIC = `${TEST_IDL_FILES}properties-basic.idl`;
const PROPERTIES_DISTINGUISH = `${TEST_IDL_FILES}properties-distinguish.idl`;
const PROPERTIES_EVENTHANDLER = `${TEST_IDL_FILES}properties-eventhandler.idl`;
const PROPERTIES_MAPLIKE = `${TEST_IDL_FILES}properties-maplike.idl`;
const PROPERTIES_MAPLIKE_READONLY = `${TEST_IDL_FILES}properties-maplike-readonly.idl`;
const PROPERTIES_OTHER = `${TEST_IDL_FILES}properties-other.idl`;
const PROPERTIES_SETLIKE = `${TEST_IDL_FILES}properties-setlike.idl`;
const PROPERTIES_SETLIKE_READONLY = `${TEST_IDL_FILES}properties-setlike-readonly.idl`;
const SIMPLE_SOURCE = `${TEST_IDL_FILES}url-source.idl`;
const SETTERS_BOTH = `${TEST_IDL_FILES}setters-both.idl`;
const SETTERS_NAMED_ONLY = `${TEST_IDL_FILES}setters-named-only.idl`;
const SETTERS_UNNAMED_ONLY = `${TEST_IDL_FILES}setters-unnamed-only.idl`;
const STRINGIFIER = `${TEST_IDL_FILES}stringifier.idl`;

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

function countIterableMethods(methods) {
  let methCount = 0;
  const ITERABLE_METHODS = ['entries', 'forEach', 'keys', 'values'];
  ITERABLE_METHODS.forEach((i) => {
    let found = methods.some((m) => {
      return m.name === i;
    });
    if (found) { methCount++ }
  });
  return methCount;
}

describe('InterfaceSourceRecord', () => {

  describe('Callback interfaces', () => {
    it('Confirms that callback interface IDL is processed without errors', () => {
      const source = loadSource(INTERFACE_CALLBACK);
      let foundErr;
      try {
        const sr = new InterfaceSourceRecord('callback', 'interface', { path: INTERFACE_CALLBACK, sourceIdl: source });
      } catch (error) {
        foundErr = error
        console.log(error);
      }
      assert.ok(!(foundErr instanceof IDLError));
    });
  });

  describe('deleters', () => {
    it('Confirms that only named deleters are counted', () => {
      const source = loadSource(DELETERS);
      const sr = new InterfaceSourceRecord('deleters', 'interface', { path: DELETERS, sourceIdl: source });
      const deleters = sr.getDeleters();
      assert.strictEqual(deleters.length, 3);
    });
  });

  describe('eventHandlers', () => {
    it('Confirms that all known variations of EventHandler IDL are counted', () => {
      const source = loadSource(EVENT_HANDLERS);
      const sr = new InterfaceSourceRecord('otFlag', 'interface', { path: EVENT_HANDLERS, sourceIdl: source });
      const handlers = sr.getEvents();
      assert.strictEqual(handlers.length, 3);
    });
    it('Confirms that null is returned when there are no event handlers', () => {
      const source = loadSource(NO_EVENTHANDLERS);
      const sr = new InterfaceSourceRecord('otFlag', 'interface', { path: NO_EVENTHANDLERS, sourceIdl: source });
      const handlers = sr.getEvents();
      assert.strictEqual(handlers, undefined);
    });
  });

  describe('flagStatus', () => {
    it('Confirms origin trial for simple flag', () => {
      let source = loadSource(FLAG_INTERFACE_OT);
      const sr = new InterfaceSourceRecord('otFlag', 'interface', { path: FLAG_INTERFACE_OT, sourceIdl: source });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'origintrial');
    });
    it('Confirms dev trial for simple flag', () => {
      let source = loadSource(FLAG_INTERFACE_DT);
      const sr = new InterfaceSourceRecord('dtFlag', 'interface', { path: FLAG_INTERFACE_DT, sourceIdl: source });
      const flagStatus = sr.flagStatus;
      assert.strictEqual(flagStatus, 'devtrial');
    });
  });

  describe('getAllMembers()', () => {
    it('Confirms that all records for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new InterfaceSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const record = sr.getAllMembers();
      assert.strictEqual(record.length, 2);
    })
  });

  describe('getBurnRecords', () => {
    it('Confirms that burn records contain proper constructor keys', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const sr = new InterfaceSourceRecord('ConstructorNoArgs', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
      const records = sr.getBurnRecords();
      const found = records.find((r) => {
        return r.name === 'ConstructorNoArgs';
      });
      assert.ok(found);
    });
    it('Confirms that burn records do not contain mixins', () => {
      const source = loadSource(MIXIN_NO_INCLUDES);
      const sr = new InterfaceSourceRecord('mixin', 'mixin', { path: MIXIN_NO_INCLUDES, sourceIdl: source });
      const records = sr.getBurnRecords();
      assert.ok(!records.size);
    });
  });

  describe('getConstructors', () => {
    it('Confirms that a constructor without arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const sr = new InterfaceSourceRecord('constructor', 'interface', { path: CONSTRUCTOR_NO_ARGS, sourceIdl: source });
      const record = sr.getConstructors();
      assert.strictEqual(record.length, 1);
    });
    it('Confirms that constructors with multiple arguments are processed', () => {
      const source = loadSource(CONSTRUCTOR_ARGS);
      const sr = new InterfaceSourceRecord('constructor', 'interface', { path: CONSTRUCTOR_ARGS, sourceIdl: source });
      const record = sr.getConstructors();
      assert.strictEqual(record[0].arguments.length, 3);
    });
    it('Confirms that constructors with complex arguemnts are returned', () => {
      const source = loadSource(CONSTRUCTOR_COMPLEX_ARG);
      const sr = new InterfaceSourceRecord('constructor', 'interface', { path: CONSTRUCTOR_COMPLEX_ARG, sourceIdl: source });
      const record = sr.getConstructors();
      const found = record.find((r) => {
        // return arg === 'sequence<CSSTransformComponent>';
        const arg = r.arguments.find((a) => {
          return a === 'sequence<CSSTransformComponent> transforms';
        });
        return arg;
      });
      assert.strictEqual(found.arguments[0], 'sequence<CSSTransformComponent> transforms');
    });
  });

  describe('getEvents', () => {
    it('Confirms that event callbacks are processed', () => {
      const source = loadSource(EVENT_HANDLERS);
      const sr = new InterfaceSourceRecord('events', 'interface', { path: EVENT_HANDLERS, sourceIdl: source });
      const record = sr.getEvents();
      assert.strictEqual(record.length, 3);
    });
  })

  describe('getKeys()', () => {
    it('Confirms that all keys for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new InterfaceSourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const record = sr.getKeys();
      assert.strictEqual(record.length, 3);
    });
  });

  describe('getMethods()', () => {
    it('Confirms that all basic members are counted', () => {
      const source = loadSource(METHODS_BASIC);
      const sr = new InterfaceSourceRecord('methods-basic', 'interface', { path: METHODS_BASIC, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 2);
    });
    it('Confirms that methods with synchronous arguments are processed', () => {
      const source = loadSource(METHODS_SYNC_ARGUMENTS);
      const sr = new InterfaceSourceRecord('methods-sync', 'interface', { path: METHODS_SYNC_ARGUMENTS, sourceIdl: source });
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
        it('Confirms that stringifier keywords are processed', () => {
          const source = loadSource(STRINGIFIER);
          const sr = new InterfaceSourceRecord('stringifier', 'interface', { path: STRINGIFIER, sourceIdl: source });
          const record = sr.getMethods();
          assert.strictEqual(record[0].name, 'toString');
        });
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
      const sr = new InterfaceSourceRecord('properties-basic', 'interface', { path: PROPERTIES_BASIC, sourceIdl: source });
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 2);
    });
    it('Confirms that eventHandler is excluded', () => {
      const source = loadSource(PROPERTIES_EVENTHANDLER);
      const sr = new InterfaceSourceRecord('properties-eh-excluded', 'interface', { path: PROPERTIES_EVENTHANDLER, sourceIdl: source });
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 2);
    });
    it('Confirms that return type is recorded', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const sr = new InterfaceSourceRecord('properties-returnType', 'interface', { path: PROPERTIES_BASIC, sourceIdl: source});
      const properties = sr.getProperties();
      assert.strictEqual(properties[0].returnType, 'FontFaceLoadStatus');
    });
    it('Confirms that a false positive is avoided', () => {
      // A false positive is a method that contians the word 'attribute' within
      const source = loadSource(PROPERTIES_DISTINGUISH);
      const sr = new InterfaceSourceRecord('properties-falsePlus', 'interface', { path: PROPERTIES_DISTINGUISH, sourceIdl: source});
      const properties = sr.getProperties();
      assert.strictEqual(properties.length, 1);
    });
    it('Confirms that array return types are returned', () => {
      const source = loadSource(PROPERTIES_OTHER);
      const sr = new InterfaceSourceRecord('properties-array-return', 'interface', { path: PROPERTIES_OTHER, sourceIdl: source });
      const properties = sr.getProperties();
      const aProperty = properties.find((p) => {
        return p.returnType === 'FrozenArray<DOMPointReadOnly>';
      });
      assert.strictEqual(aProperty.name, 'polygon');
    });
    it('Confirms that variable return types are returned', () => {
      const source = loadSource(PROPERTIES_OTHER);
      const sr = new InterfaceSourceRecord('properties-array-return', 'interface', { path: PROPERTIES_OTHER, sourceIdl: source });
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
      const sr = new InterfaceSourceRecord('PropertiesBasic', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const urls = sr.getUrls();
      const isComplete = URLS.every((u) => {
        console.log(u);
        return urls.includes(u);
      });
      assert.ok(isComplete);
    });
    it('Confirms that interface urls have no trailing slash', () => {
      const interfaceURL = 'https://developer.mozilla.org/en-US/docs/Web/API/PropertiesBasic';
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new InterfaceSourceRecord('PropertiesBasic', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const urls = sr.getUrls();
      const found = urls.find((u) => {
        return u === interfaceURL;
      });
      
      assert.strictEqual(`${found}`, interfaceURL);
    });
  });

  describe('inDevTrial', () => {
    it('Confirms true is returned for interface in a dev trial', () => {
      const source = loadSource(IN_DEV_TRIAL);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: IN_DEV_TRIAL, sourceIdl: source });
      assert.ok(sr.inDevTrial);
    });
    it('Confirms false is returned for a stable interface', () => {
      const source = loadSource(INTERFACE_STABLE);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.ok(!sr.inDevTrial);
    });
    it('Confirms false is returned for interface in an origin trial', () => {
      const source = loadSource(IN_ORIGIN_TRIAL);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: IN_ORIGIN_TRIAL, sourceIdl: source });
      assert.ok(!sr.inDevTrial);
    });
  });

  describe('interfaceName', () => {
    it('Confirms that the structure name is returned from a simple IDL file', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new InterfaceSourceRecord('PropertiesBasic', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
    });
    it('Confirms that the name of a child interface is returned', () => {
      const source = loadSource(INTERFACE_PARENT);
      const sr = new InterfaceSourceRecord('InterfaceParent', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'InterfaceParent');
    });
    it('Confirms that structure name is returned from a simple namespace file', () => {
      const source = loadSource(NAMESPACE_SIMPLE);
      const sr = new InterfaceSourceRecord('NamespaceName', 'namespace', { path: NAMESPACE_SIMPLE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'NamespaceName');
    });
    it('Confirms that structure name is returned from a simple namespace file', () => {
      const source = loadSource(NAMESPACE_PARTIAL);
      const sr = new InterfaceSourceRecord('PartialNamespaceName', 'namespace', { path: NAMESPACE_PARTIAL, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'PartialNamespaceName');
    });
  });

  describe('inOriginTrial', () => {
    it('Confirms true is returned for interface in an origin trial', () => {
      const source = loadSource(IN_ORIGIN_TRIAL);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: IN_ORIGIN_TRIAL, sourceIdl: source });
      assert.ok(sr.inOriginTrial);
    });
    it('Confirms false is returned for a stable interface', () => {
      const source = loadSource(INTERFACE_STABLE);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.ok(!sr.inOriginTrial);
    });
    it('Confirms false is returned for interface in a dev trial', () => {
      const source = loadSource(IN_DEV_TRIAL);
      const sr = new InterfaceSourceRecord('originTrial', 'interface', { path: IN_DEV_TRIAL, sourceIdl: source });
      assert.ok(!sr.inOriginTrial);
    });
  });


  describe('iterable IDL keyword', () => {
    it('confirms that keyword \'iterable\' adds four standard methods', () => {
      const source = loadSource(ITERABLE_ONE_ARG);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: ITERABLE_ONE_ARG, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 4);
    });
    it('Confirms that an iterable with a sequence as one of several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG_SEQ);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: ITERABLE_MULTI_ARG_SEQ, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 4);
    });
    it('Confirms that an iterable with one arg is recognized', () => {
      const source = loadSource(ITERABLE_ONE_ARG);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: ITERABLE_ONE_ARG, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 4);
    });
    it('Confirms that an iterable with several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: ITERABLE_MULTI_ARG, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 4);
    });
    it('Confirms that an iterable with a sequence as its one arg is recognized', () => {
      const source = loadSource(ITERABLE_SEQUENCE_ARG);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: ITERABLE_SEQUENCE_ARG, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 4);
    });
    it('Confirms that iterable returns an empty array when the IDL contains no iterable', () => {
      const source = loadSource(NO_ITERABLE);
      const sr = new InterfaceSourceRecord('iterable', 'interface', { path: NO_ITERABLE, sourceIdl: source });
      const methods = sr.getMethods();
      const methodCount = countIterableMethods(methods);
      assert.strictEqual(methodCount, 0);
    });
  });

  describe('key', () => {
    it('Confirms that the key property returns a correct value', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new InterfaceSourceRecord('PropertiesBasic', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'PropertiesBasic');
    });
    it('Confirms that a mixin returns the interface as its key name', () => {
      const source = loadSource(INTERFACE_MIXIN);
      const sr = new InterfaceSourceRecord('MixinBody', 'interface', { path: INTERFACE_MIXIN, sourceIdl: source });
      assert.strictEqual(sr.key, 'MixinBody');
    })
  });

  describe('getSecureContext()', () => {
    it('Confirms that secure context status is extracted from IDL', () => {
      const source = loadSource(INTERFACE_SECURE_CONTEXT);
      const sr = new InterfaceSourceRecord('secure-context', 'interface', { path: INTERFACE_SECURE_CONTEXT, sourceIdl: source });
      assert.ok(sr.getSecureContext());
    });
  });

  describe('maplikeMethods', () => {
    it('Confirms that only readonly properties are returned', () => {
      const source = loadSource(PROPERTIES_MAPLIKE_READONLY);
      const sr = new InterfaceSourceRecord('maplike', 'interface', { path: PROPERTIES_MAPLIKE_READONLY, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 7);
    });
    it('Confirms that all methods are returned', () => {
      const source = loadSource(PROPERTIES_MAPLIKE);
      const sr = new InterfaceSourceRecord('maplike', 'interface', { path: PROPERTIES_MAPLIKE, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 10);
    });
  });

  describe('namedGetters', () => {
    it('Confirms that named getters returns items when file contains named and unnamed getters', () => {
      const source = loadSource(GETTERS_BOTH);
      const sr = new InterfaceSourceRecord('namedGetters', 'interface', { path: GETTERS_BOTH, sourceIdl: source });
      const getters = sr.getNamedGetters();
      assert.strictEqual(getters.length, 2);
    });
    it('Confirms that named getters returns items when file contains only named getters', () => {
      const source = loadSource(GETTERS_SIMPLE_NAMED_ONLY);
      const sr = new InterfaceSourceRecord('namedGetters', 'interface', { path: GETTERS_SIMPLE_NAMED_ONLY, sourceIdl: source });
      const getters = sr.getNamedGetters();
      assert.ok(getters.length > 0);
    });
    it('Confirms that complex named getters are processed correctly', () => {
      const source = loadSource(GETTERS_COMPLEX_NAMED_ONLY);
      const sr = new InterfaceSourceRecord('namedGetters', 'interface', { path: GETTERS_SIMPLE_NAMED_ONLY, sourceIdl: source });
      const getters = sr.getNamedGetters();
      assert.strictEqual(getters[0].returnType, 'RadioNodeList or Element');
    });
    it('Confirms that named getters returns no items when file contains no named getters', () => {
      const source = loadSource(GETTERS_UNNAMED_ONLY);
      const sr = new InterfaceSourceRecord('namedGetters', 'interface', { path: GETTERS_UNNAMED_ONLY, sourceIdl: source });
      const getters = sr.getNamedGetters();
      assert.strictEqual(getters.length, 0);
    });
    it('Confirms that a named getter\'s return value is processed', () => {
      const source = loadSource(GETTERS_RETURN_VAL);
      const sr = new InterfaceSourceRecord('namedGetters', 'interface', { path: GETTERS_RETURN_VAL, sourceIdl: source });
      const getters = sr.getNamedGetters();
      assert.strictEqual(getters[0].returnType, 'SVGPoint');
    });
  });

  describe('namedSetters', () => {
    it('Confirms that namedSetters returns items when file contains named and unnamed getters', () => {
      const source = loadSource(SETTERS_BOTH);
      const sr = new InterfaceSourceRecord('namedSetters', 'interface', { path: SETTERS_BOTH, sourceIdl: source });
      const setters = sr.getNamedSetters();
      assert.strictEqual(setters.length, 1);
    });
  });

  describe('setlikeMethods', () => {
    it('Confirms that only readonly properties are returned', () => {
      const source = loadSource(PROPERTIES_SETLIKE_READONLY);
      const sr = new InterfaceSourceRecord('setlike', 'interface', { path: PROPERTIES_SETLIKE_READONLY, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 6);
    });
    it('Confirms that all methods are returned', () => {
      const source = loadSource(PROPERTIES_SETLIKE);
      const sr = new InterfaceSourceRecord('setlike', 'interface', { path: PROPERTIES_SETLIKE, sourceIdl: source });
      const methods = sr.getMethods();
      assert.strictEqual(methods.length, 9);
    });
  });
});