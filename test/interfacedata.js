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

const assert = require('assert');
const fs = require('fs');
const utils = require('../utils.js');

const { InterfaceData } = require('../interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const ALTERNATE_KEY = './test/files/alternate-key.idl';
const CONSTRUCTORS = './test/files/all-constructors.idl';
const CONSTRUCTOR_ARGUMENTS = './test/files/constructor-arguments.idl';
const CONSTRUCTOR_BRACKET_ARG = './test/files/constructor-bracket-arg.idl';
const CONSTRUCTOR_NO_ARGS = './test/files/constructor-noarguments.idl';
const CONSTRUCTOR_ONE_ARGUMENT = './test/files/constructor-1-argument.idl';
const DELETERS = './test/files/all-deleters.idl';
const EVENTHANDLERS = './test/files/all-event-handlers.idl';
const EXPOSED_MANY = './test/files/exposed-many.idl';
const EXPOSED_ONE = './test/files/exposed-one.idl';
const EXTENDED_ATTRIBUTES_MISSING = './test/files/extended-attributes-missing.idl';
const EXTENDED_ATTRIBUTES_REVERSED = './test/files/extended-attributes-reversed.idl';
const FLAGGED_INTERFACE = './test/files/interface-rte-test.idl';
const FLAGGED_MEMBERS = './test/files/flagged-members.idl';
const GETTERS_BOTH = './test/files/getters-both.idl';
const GETTERS_NAMED_ONLY = './test/files/getters-named-only.idl';
const GETTERS_UNNAMED_ONLY = './test/files/getters-unnamed-only.idl';
const INTERFACE_CALLBACK = './test/files/interface-callback.idl';
const INTERFACE_MIXIN = './test/files/mixin.idl';
const INTERFACE_NOPARENT = './test/files/interface-noparent.idl';
const INTERFACE_PARENT = './test/files/interface-parent.idl';
const INTERFACE_PARTIAL = './test/files/interface-partial.idl';
const INTERFACE_STANDARD = './test/files/burnable.idl';
const ITERABLE_MULTI_ARG_SEQ = './test/files/iterable-multi-arg-sequence.idl';
const ITERABLE_MULTI_ARG = './test/files/iterable-multi-arg.idl';
const ITERABLE_ONE_ARG = './test/files/iterable-one-arg.idl';
const ITERABLE_SEQUENCE_ARG = './test/files/iterable-sequence-arg.idl';
const METHOD_ARGUMENTS_COUNT = './test/files/method-argument-count.idl';
const METHOD_MULTI_RETURNS = './test/files/method-multi-returns.idl';
const METHOD_NO_ARGUMENTS = './test/files/method-noarguments.idl';
const METHOD_PROMISES = './test/files/method-promises.idl';
const METHOD_PROMISE_RESOLUTION = './test/files/method-promise-resolution.idl';
const METHOD_PROMISE_VOID = './test/files/method-promise-void.idl';
const METHOD_SYNCHRONOUS = './test/files/method-synchronous.idl';
const OT_MEMBERS = './test/files/ot-members.idl';
const PROPERTIES_BASIC = './test/files/properties-basic.idl';
const PROPERTIES_EVENTHANDLER = './test/files/properties-eventhandler.idl';
const PROPERTIES_MAPLIKE = './test/files/properties-maplike.idl';
const PROPERTIES_MAPLIKE_READONLY = './test/files/properties-maplike-readonly.idl';
const PROPERTIES_SETLIKE = './test/files/properties-setlike.idl';
const PROPERTIES_SETLIKE_READONLY = './test/files/properties-setlike-readonly.idl';
const RUNTIMEENABLED_IFACE_EXPER_RE = './test/files/runtimeenabled-interface-exper.idl';
const RUNTIMEENABLED_IFACE_MISSING_RE = './test/files/runtimeenabled-interface-missing.idl';
const RUNTIMEENABLED_IFACE_OT_RE = './test/files/runtimeenabled-interface-ot.idl';
const SECURE_CONTEXT = './test/files/secure-context.idl';
const SETTERS_BOTH = './test/files/setters-both.idl';
const SETTERS_NAMED_ONLY = './test/files/setters-named-only.idl';
const SETTERS_UNNAMED_ONLY = './test/files/setters-unnamed-only.idl';
const STRINGIFIER = './test/files/stringifier.idl';
const NO_CONSTRUCTOR = './test/files/no-constructor.idl';
const NO_DELETERS = './test/files/no-deleters.idl';
const NO_EVENTHANDLERS = './test/files/no-event-handlers.idl';
const NO_GETTERS = './test/files/no-getters.idl';
const NO_ITERABLE = './test/files/no-iterable.idl';
const NO_SETTERS = './test/files/no-setters.idl';

const UNNAMED_MEMBER = '';

const MEMBERS = [
  "constructors",
  "deleters",
  "eventHandlers",
  "getters",
  "iterable",
  "maplikeMethods",
  "methods",
  "namedGetters",
  "namedSetters",
  "properties",
  "readOnlyProperties",
  "readWriteProperties",
  "setters",
  "unnamedGetter",
  "unnamedSetter"
];

function loadSource(sourcePath) {
  return utils.getIDLFile(sourcePath);
}

describe('InterfaceData', () => {
  describe('Extended attributes', () => {
    it('Confirms that extended attribute order is irrelevant to reading their values', () => {
      const sourceOne = loadSource(RUNTIMEENABLED_IFACE_OT_RE);
      const id1 = new InterfaceData(sourceOne, RUNTIMEENABLED_IFACE_OT_RE);
      const sourceTwo = loadSource(EXTENDED_ATTRIBUTES_REVERSED);
      const id2 = new InterfaceData(sourceTwo, EXTENDED_ATTRIBUTES_REVERSED);
      assert.equal(id1.originTrial, id2.originTrial);
    });
  });

  describe('Callback interfaces', () => {
    it('Confirms that callback interfaces are loaded and processed', () => {
      const source = loadSource(INTERFACE_CALLBACK);
      const id = new InterfaceData(source, INTERFACE_CALLBACK);
      assert.strictEqual(id.name, "InterfaceCallback");
    })
  })

  describe('Partial interfaces', () => {
    it('Confirms that partial interfaces are loaded and processed', () => {
      const source = loadSource(INTERFACE_PARTIAL);
      const id = new InterfaceData(source, INTERFACE_PARTIAL);
      assert.equal(id.name, "InterfacePartial");
    });
  });

  describe('Member flags', () => {
    it('Confirms that all flagged members return true for .flagged', () => {
      // Excludes testing of setlike because of overlap with maplike.
      const source = loadSource(FLAGGED_MEMBERS);
      const id = new InterfaceData(source, FLAGGED_MEMBERS);
      let foundIncorrect = {};
      let passFail = MEMBERS.every(memberName => {
        let member = id[memberName];
        return member.every(elem => {
          if (!elem.flagged) { foundIncorrect += `${memberName} ${JSON.stringify(elem)}\n`; }
          return elem.flagged
        });
      });
      assert.ok(passFail, foundIncorrect);
    });
  });

  describe('Member origin trial', () => {
    it('Confirms that all origin trial members return true for .originTrial', () => {
      // Excludes testing of setlike because of overlap with maplike.
      const source = loadSource(OT_MEMBERS);
      const id = new InterfaceData(source, OT_MEMBERS);
      let foundIncorrect = {};
      let passFail = MEMBERS.every(memberName => {
        let member = id[memberName];
        return member.every(elem => {
          if (!elem.originTrial) { foundIncorrect += `${memberName} ${JSON.stringify(elem)}\n` }
          return elem.originTrial;
        });
      });
      assert.ok(passFail, foundIncorrect);
    });
  });

  describe('constructors', () => {
    it('Confirms that constructors returns null when no constructors are present', () => {
      const source = loadSource(NO_CONSTRUCTOR);
      const id = new InterfaceData(source, NO_CONSTRUCTOR);
      assert.equal(id.constructors.length, 0);
    });
    it('Confirms that a constructor without arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const id = new InterfaceData(source, CONSTRUCTOR_NO_ARGS);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length === 0;
      });
      assert.equal(found.arguments.length, 0, JSON.stringify(found));
    });
    it('Confirms that a constructor with one argument can be found', () => {
      const source = loadSource(CONSTRUCTOR_ONE_ARGUMENT);
      const id = new InterfaceData(source, CONSTRUCTOR_ONE_ARGUMENT);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length === 1;
      });
      assert.equal(found.arguments.length, 1, JSON.stringify(found));
    })
    it('Confirms that a constructor with arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_ARGUMENTS);
      const id = new InterfaceData(source, CONSTRUCTOR_ARGUMENTS);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length > 0;
      });
      assert.equal(found.arguments.length, 3, JSON.stringify(found));
    });
    it('Confirms that all constructor interfacess are counted', () => {
      const source = loadSource(CONSTRUCTORS);
      const id = new InterfaceData(source, CONSTRUCTORS);
      assert.equal(id.constructors.length, 2);
    });
    it('Confirms processing of constructors with square brackets in args', () => {
      const source = loadSource(CONSTRUCTOR_BRACKET_ARG);
      const id = new InterfaceData(source, CONSTRUCTOR_BRACKET_ARG);
      assert.ok(id.hasConstructor);
    })
  });

  describe('deleters', () => {
    it('Confirms that all known variations of deleter IDL are counted', () => {
      const source = loadSource(DELETERS);
      const id = new InterfaceData(source, DELETERS);
      assert.equal(id.deleters.length, 4);
    });
    it('Confirms that null is returned when there are no deleters', () => {
      const source = loadSource(NO_DELETERS);
      const id = new InterfaceData(source, NO_DELETERS);
      assert.equal(id.deleters.length, 0);
    });
    it('Confirms that an unnamed deleter is processed from the IDL file', () => {
      const source = loadSource(DELETERS);
      const id = new InterfaceData(source, DELETERS);
      const found = id.deleters.some(elem => {
        return elem.name == UNNAMED_MEMBER;
      });
    });
  });

  describe('eventHandlers', () => {
    it('Confirms that all known variations of EventHandler IDL are counted', () => {
      const source = loadSource(EVENTHANDLERS);
      const id = new InterfaceData(source, EVENTHANDLERS);
      assert.equal(id.eventHandlers.length, 3);
    });
    it('Confirms that null is returned when there are no event handlers', () => {
      const source = loadSource(NO_EVENTHANDLERS);
      const id = new InterfaceData(source, NO_EVENTHANDLERS);
      assert.equal(id.eventHandlers.length, 0);
    });
  });

  describe('exposed', () => {
    it('Confirms one exposed interface is returned', () => {
      const source = loadSource(EXPOSED_ONE);
      const id = new InterfaceData(source, EXPOSED_ONE);
      assert.equal(id.exposed.length, 1);
    });
    it('Confirms multiple exposed interfaces are returned', () => {
      const source = loadSource(EXPOSED_MANY);
      const id = new InterfaceData(source, EXPOSED_MANY);
      assert.equal(id.exposed.length, 2);
    });
  });

  describe('flagged', () => {
    it('Confirms that flagged returns a boolean', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_MISSING_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(typeof id.flagged === "boolean");
    });
    it('Confirms that false is returned when the flag name is not found', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_MISSING_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(!id.flagged);
    });
    it('Confirms that true is returned when the flag name is found', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_EXPER_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_EXPER_RE);
      assert.ok(id.flagged);
    });
    it('Confirms that false is returned when etended attributes are not present', () => {
      const source = loadSource(EXTENDED_ATTRIBUTES_MISSING);
      const id = new InterfaceData(source, EXTENDED_ATTRIBUTES_MISSING);
      assert.ok(!id.flagged);
    });
  });

  describe('getMembers()', () => {
    it('Confirms that getMembers() returns all items', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      const members = id.getMembers(true, true);
      assert.equal(members.length, 10);
    });
    it('Confirms that getMembers() returns only stable items', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      const members = id.getMembers(false, false);
      assert.equal(members.length, 7);
    });
    it('Confirms that getMembers() returns only stable and flagged items', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      const members = id.getMembers(true, false);
      assert.equal(members.length, 9);
    });
    it('Confirms that getMembers() returns only stable and origin trial items', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      const members = id.getMembers(false, true);
      assert.equal(members.length, 8);
    });
    it('Confirms that getMembers() returns only named getters when requested', () => {
      const source = loadSource(GETTERS_BOTH);
      const id = new InterfaceData(source);
      const members = id.getMembers(false, false, false);
      assert.strictEqual(members.length, 3);
    });
    it('Confirms that getMembers() returns only named setters when requested', () => {
      const source = loadSource(SETTERS_BOTH);
      const id = new InterfaceData(source);
      const members = id.getMembers(false, false, false);
      assert.strictEqual(members.length, 2);
    });
  });

  describe('getMembersBurnRecords', () => {
    it('Confirms return of records for an interface and a member', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      const records = id.getMembersBurnRecords('Burnable.check');
      assert.equal(records.length, 2);
    });
  });

  describe('getters', () => {
    it('Confirms that getter returns all named and unnamed getters', () => {
      const source = loadSource(GETTERS_BOTH);
      const id = new InterfaceData(source, GETTERS_BOTH);
      assert.ok(id.getters.length === 3);
    });
    it('Confirms that getter returns a getter when file contains only an unnamed getter', () => {
      const source = loadSource(GETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, GETTERS_UNNAMED_ONLY);
      assert.ok(id.getters.length === 1);
    });
    it('Confirms that getter returns null when file contains no getters', () => {
      const source = loadSource(NO_GETTERS);
      const id = new InterfaceData(source, NO_GETTERS);
      assert.ok(id.getters.length === 0);
    });
  });

  describe('hasConstructor', () => {
    it('Confirms that hasConstructor returns false when a constructor is missing', () => {
      const source = loadSource(NO_CONSTRUCTOR);
      const id = new InterfaceData(source, NO_CONSTRUCTOR);
      assert.ok(id.hasConstructor === false);
    });
    it('Confirms that hasConstructor returns true when a constructor is present', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const id = new InterfaceData(source, CONSTRUCTOR_NO_ARGS);
      assert.ok(id.hasConstructor === true);
    });
  });

  describe('Interface under test ', () => {
    it('confirms that a flag value of \'test\' returns as true', () => {
      const source = loadSource(FLAGGED_INTERFACE);
      const id = new InterfaceData(source, FLAGGED_INTERFACE);
      assert.ok(id.inTest === true);
    });
    it('Confirms that false is returned when etended attributes are not present', () => {
      const source = loadSource(EXTENDED_ATTRIBUTES_MISSING);
      const id = new InterfaceData(source, EXTENDED_ATTRIBUTES_MISSING);
      assert.ok(!id.inTest === true);
    });
  });

  describe('iterable', () => {
    it('Confirms that an iterable with a sequence as one of several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG_SEQ);
      const id = new InterfaceData(source, ITERABLE_MULTI_ARG_SEQ);
      assert.equal(id.iterable[0].arguments[1], 'sequence<CSSStyleValue>');
    });
    it('Confirms that an iterable with one arg is recognized', () => {
      const source = loadSource(ITERABLE_ONE_ARG);
      const id = new InterfaceData(source, ITERABLE_ONE_ARG);
      assert.equal(id.iterable[0].arguments.length, 1);
    });
    it('Confirms that an iterable with several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG);
      const id = new InterfaceData(source, ITERABLE_MULTI_ARG);
      assert.equal(id.iterable[0].arguments.length, 2);
    });
    it('Confirms that an iterable with a sequence as its one arg is recognized', () => {
      const source = loadSource(ITERABLE_SEQUENCE_ARG);
      const id = new InterfaceData(source, ITERABLE_SEQUENCE_ARG);
      assert.equal(id.iterable[0].arguments[0], 'sequence<CSSStyleValue>');
    });
    it('Confirms that iterable returns an empty array when the IDL contains no iterable', () => {
      const source = loadSource(NO_ITERABLE);
      const id = new InterfaceData(source, NO_ITERABLE);
      assert.equal(id.iterable.length, 0);
    });
  });
  describe('key', () => {
    it('Conirms that key returns the actual key', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source, INTERFACE_STANDARD);
      assert.strictEqual(id.key, 'Burnable');
    });
    it('Confirms that an alternate key is returned', () => {
      const source = loadSource(ALTERNATE_KEY);
      const id = new InterfaceData(source, ALTERNATE_KEY);
      assert.strictEqual(id.key, 'WEBGL_color_buffer_float');
    })
  })

  // Needs to read out of a test file that contains methods.
  describe('maplikeMethods', () => {
    it('Confirms that only readonly properties are returned', () => {
      const source = loadSource(PROPERTIES_MAPLIKE_READONLY);
      const id = new InterfaceData(source, PROPERTIES_MAPLIKE_READONLY);
      assert.equal(id.maplikeMethods.length, 7);
    });
    it('Confirms that all methods are returned', () => {
      const source = loadSource(PROPERTIES_MAPLIKE);
      const id = new InterfaceData(source, PROPERTIES_MAPLIKE);
      assert.equal(id.maplikeMethods.length, 10);
    });
  });

  describe('methods', () => {
    it('Confirms that the correct number of promise-based methods are returned', () => {
      const source = loadSource(METHOD_PROMISES);
      const id = new InterfaceData(source, METHOD_PROMISES);
      assert.equal(id.methods.length, 4);
    });
    it('Confirms that the correct number of synchronous methods are returned', () => {
      const source = loadSource(METHOD_SYNCHRONOUS);
      const id = new InterfaceData(source, METHOD_SYNCHRONOUS);
      assert.equal(id.methods.length, 2);
    });
    it('Confirms that methods with arguments are processed', () => {
      const source = loadSource(METHOD_SYNCHRONOUS);
      const id = new InterfaceData(source, METHOD_SYNCHRONOUS);
      let methodsWithArguments = 0;
      id.methods.forEach(method => {
        if (method.arguments.length > 0) { methodsWithArguments++; }
      });
      assert.equal(methodsWithArguments, 1);
    });
    it('Confirms that methods without arguments are processed', () => {
      const source = loadSource(METHOD_SYNCHRONOUS);
      const id = new InterfaceData(source, METHOD_SYNCHRONOUS);
      let methodsWithoutArguments = 0;
      id.methods.forEach(method => {
        if (method.arguments.length == 0) { methodsWithoutArguments++; }
      });
      assert.equal(methodsWithoutArguments, 1);
    });
    it('Confirms that methods with multiple return types are processed', () => {
      const source = loadSource(METHOD_MULTI_RETURNS);
      const id = new InterfaceData(source, METHOD_MULTI_RETURNS);
      assert.equal(id.methods[0].arguments.length, 1);
    });
    it('Confirms that method.args returns the correct number of args, when present', () => {
      const source = loadSource(METHOD_ARGUMENTS_COUNT);
      const id = new InterfaceData(source, METHOD_ARGUMENTS_COUNT);
      assert.equal(id.methods[0].arguments.length, 2);
    });
    it('Confirms that method.args equals 0 when there are no args present', () => {
      const source = loadSource(METHOD_NO_ARGUMENTS);
      const id = new InterfaceData(source, METHOD_NO_ARGUMENTS);
      assert.equal(id.methods[0].arguments.length, 0);
    });
    it('Confirms that method.resolutions returns a value', () => {
      const source = loadSource(METHOD_PROMISE_RESOLUTION);
      const id = new InterfaceData(source, METHOD_PROMISE_RESOLUTION);
      assert.equal(id.methods[0].resolution, "DOMString");
    });
    it('Confirms that method.resolutions returns "void"', () => {
      const source = loadSource(METHOD_PROMISE_VOID);
      const id = new InterfaceData(source, METHOD_PROMISE_VOID);
      assert.equal(id.methods[0].resolution, "void");
    });
    it('Confirms that stringifier keywords are processed', () => {
      const source = loadSource(STRINGIFIER);
      const id = new InterfaceData(source, STRINGIFIER);
      assert.equal(id.methods[0].name, "toString");
    });
  });

  describe('mixin', () => {
    it('Confirms that mixin IDL loads without errors', () => {
      const source = loadSource(INTERFACE_MIXIN);
      try {
        const id = new InterfaceData(source, INTERFACE_MIXIN);
        assert.ok(id.mixin);
      } catch (error) {
        throw error;
      }
    })
  });

  describe('name', () => {
    it('Confirms that the correct name is returned for a standard interface IDL', () => {
      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source, INTERFACE_STANDARD);
      assert.strictEqual(id.name, 'Burnable');
    });
    it('Confirms that the correct name is returned for a callback interface IDL', () => {
      const source = loadSource(INTERFACE_CALLBACK);
      const id = new InterfaceData(source, INTERFACE_CALLBACK);
      assert.strictEqual(id.name, 'InterfaceCallback')
    })
    it('Confirms that the correct name is returned for a mixin interface IDL', () => {
      const source = loadSource(INTERFACE_MIXIN);
      const id = new InterfaceData(source, INTERFACE_MIXIN);
      assert.strictEqual(id.name, 'Body');
    });
    it('Confirms that the correct name is returned for a partial interface IDL', () => {
      const source = loadSource(INTERFACE_PARTIAL);
      const id = new InterfaceData(source, INTERFACE_PARTIAL);
      assert.strictEqual(id.name, 'InterfacePartial')
    });
  });

  describe('namedGetters', () => {
    it('Confirms that named getters returns items when file contains named and unnamed getters', () => {
      const source = loadSource(GETTERS_BOTH);
      const id = new InterfaceData(source, GETTERS_BOTH);
      assert.equal(id.namedGetters.length, 2);
    });
    it('Confirms that named getters returns items when file contains only named getters', () => {
      const source = loadSource(GETTERS_NAMED_ONLY);
      const id = new InterfaceData(source, GETTERS_NAMED_ONLY);
      assert.ok(id.namedGetters.length > 0);
    });
    it('Confirms that named getters returns no items when file contains no named getters', () => {
      const source = loadSource(GETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, GETTERS_UNNAMED_ONLY);
      assert.equal(id.namedGetters.length, 0);
    });
  });


  describe('namedSetters', () => {
    it('Confirms that namedSetters returns items when file contains named and unnamed getters', () => {
      const source = loadSource(SETTERS_BOTH);
      const id = new InterfaceData(source, SETTERS_BOTH);
      assert.equal(id.namedSetters.length, 1);
    });
    it('Confirms that namedSetters returns items when file contains only named getters', () => {
      const source = loadSource(SETTERS_NAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_NAMED_ONLY);
      assert.equal(id.namedSetters.length, 1);
    });
    it('Confirms that namedSetters returns no items when file contains no named getters', () => {
      const source = loadSource(SETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_UNNAMED_ONLY);
      assert.equal(id.namedSetters.length, 0);
    });
  });
  
  describe('originTrial', () => {
    it('Confirms that originTrial returns a boolean', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_MISSING_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(typeof id.originTrial === "boolean");
    });
    it('Confirms that false is returned when the origin trial name is not found', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_MISSING_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(!id.originTrial);
    });
    it('Confirms that true is returned when the origin trial name is found', () => {
      const source = loadSource(RUNTIMEENABLED_IFACE_OT_RE);
      const id = new InterfaceData(source, RUNTIMEENABLED_IFACE_OT_RE);
      assert.ok(id.originTrial);
    });
    it('Confirms that false is returned when etended attributes are not present', () => {
      const source = loadSource(EXTENDED_ATTRIBUTES_MISSING);
      const id = new InterfaceData(source, EXTENDED_ATTRIBUTES_MISSING);
      assert.ok(!id.originTrial);
    });
  });

  describe('parentClass', () => {
    it('Confirms that the name of a parent class is returned if present', () => {
      const source = loadSource(INTERFACE_PARENT);
      const id = new InterfaceData(source, INTERFACE_PARENT);
      assert.equal(id.parentClass, "EventTarget");
    });
    it('Confirms that null is returned if an interface has no parent class', () => {
      const source = loadSource(INTERFACE_NOPARENT);
      const id = new InterfaceData(source, INTERFACE_NOPARENT);
      assert.equal(id.parentClass, null);
    })
  });
  
  describe('properties', () => {
    it('Confirms that all basic properties are counted', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const id = new InterfaceData(source, PROPERTIES_BASIC);
      assert.equal(id.properties.length, 2);
    });
    it('Confirms that eventHandler is excluded', () => {
      const source = loadSource(PROPERTIES_EVENTHANDLER);
      const id = new InterfaceData(source, PROPERTIES_EVENTHANDLER);
      assert.equal(id.properties.length, 2);
    });
    it('Confirms that return type is recorded', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const id = new InterfaceData(source, PROPERTIES_BASIC);
      const properties = id.properties;
      assert.equal(id.properties[0].returnType, 'FontFaceLoadStatus');
    });
  });

  describe('readOnlyProperties', () => {
    it ('Confirms that all readonly properties are counted', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const id = new InterfaceData(source, PROPERTIES_BASIC);
      assert.equal(id.readOnlyProperties.length, 1);
    });
  });

  describe('readWriteProperties', () => {
    it ('Confirms that all read/write properties are counted', () => {
      const source = loadSource(PROPERTIES_BASIC);
      const id = new InterfaceData(source, PROPERTIES_BASIC);
      assert.equal(id.readWriteProperties.length, 1);
    });
  });

  describe('secureContext', () => {
    it('Confirms that secureContext returns true when present', () => {
      const source = loadSource(SECURE_CONTEXT);
      const id = new InterfaceData(source, SECURE_CONTEXT);
      assert.ok(id.secureContext);
    });
    it('Confirms that secureContext returns false when not present', () => {
      const source = loadSource(EXPOSED_ONE);
      const id = new InterfaceData(source, EXPOSED_ONE);
      assert.ok(!id.secureContext);
    });
    it('Confirms that secureContext returns false when etended attributes are not present', () => {
      const source = loadSource(EXTENDED_ATTRIBUTES_MISSING);
      const id = new InterfaceData(source, EXTENDED_ATTRIBUTES_MISSING);
      assert.ok(!id.secureContext);
    });
  });

  describe('setlikeMethods', () => {
    it('Confirms that only readonly properties are returned', () => {
      const source = loadSource(PROPERTIES_SETLIKE_READONLY);
      const id = new InterfaceData(source, PROPERTIES_SETLIKE_READONLY);
      assert.equal(id.setlikeMethods.length, 6);
    });
    it('Confirms that all methods are returned', () => {
      const source = loadSource(PROPERTIES_SETLIKE);
      const id = new InterfaceData(source, PROPERTIES_SETLIKE);
      assert.equal(id.setlikeMethods.length, 9);
    });
  });

  describe('setters', () => {
    it('Confirms that setters returns both named and unnamed setters', () => {
      const source = loadSource(SETTERS_BOTH);
      const id = new InterfaceData(source, SETTERS_BOTH);
      assert.equal(id.setters.length, 2);
    });
    it('Confirms that setters returns values when file contains only an unnamed setters', () => {
      const source = loadSource(SETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_UNNAMED_ONLY);
      assert.equal(id.setters.length, 1);
    });
    it('Confirms that setters returns values when file contains only named setters', () => {
      const source = loadSource(SETTERS_NAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_NAMED_ONLY);
      assert.equal(id.setters.length, 1);
    });
    it('Confirms that no setters are returned when file contains no setters', () => {
      const source = loadSource(NO_SETTERS);
      const id = new InterfaceData(source, NO_SETTERS);
      assert.equal(id.setters.length, 0);
    });
  });

  describe('signatures', () => {
    it('Confirms that signatures returns an array', () => {
      const source = loadSource(CONSTRUCTORS);
      const id = new InterfaceData(source, CONSTRUCTORS);
      assert.ok(Array.isArray(id.signatures));
    });
  });

  describe('unnamedGetters', () => {
    it('Confirms that unnamedGetters returns an object when file contains named and unnamed getters', () => {
      const source = loadSource(GETTERS_BOTH);
      const id = new InterfaceData(source, GETTERS_BOTH);
      assert.equal(id.unnamedGetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
    it('Confirms that unnamedGetters returns no object when file contains only named getters', () => {
      const source = loadSource(GETTERS_NAMED_ONLY);
      const id = new InterfaceData(source, GETTERS_NAMED_ONLY);
      assert.equal(id.unnamedGetter.length, 0, JSON.stringify(id.unnamedGetter))
    });
    it('Confirms that an object is returned when file contains only an unamedGetter', () => {
      const source = loadSource(GETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, GETTERS_UNNAMED_ONLY);
      assert.equal(id.unnamedGetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
  });

  describe('unnamedSetters', () => {
    it('Confirms that unnamedSetters returns an object when file contains named and unnamed setters', () => {
      const source = loadSource(SETTERS_BOTH);
      const id = new InterfaceData(source, SETTERS_BOTH);
      assert.equal(id.unnamedSetter.length, 1, JSON.stringify(id));
    });
    it('Confirms that unnamedSetters returns no object when file contains only named Setters', () => {
      const source = loadSource(SETTERS_NAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_NAMED_ONLY);
      assert.equal(id.unnamedSetter.length, 0, JSON.stringify(id))
    });
    it('Confirms that an object is returned when file contains only an unamedSetter', () => {
      const source = loadSource(SETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source, SETTERS_UNNAMED_ONLY);
      assert.equal(id.unnamedSetter.length, 1, JSON.stringify(id));
    });
  });

  describe('writeKeys()', () => {
    it('Returns true when the save file contains all unflagged keys', function() {
      const keyFile = './keyfile.txt';
      if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile); }

      const source = loadSource(INTERFACE_STANDARD);
      const id = new InterfaceData(source);
      id.writeKeys(keyFile);
      const keyFileContents = fs.readFileSync(keyFile).toString();
      const keys = keyFileContents.split('\n');
      fs.unlinkSync(keyFile);
      assert.equal(keys.length, 6);
    });
  });
});