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

const { InterfaceData } = require('../__interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const CONSTRUCTORS = './test/files/all-constructors.idl';
const CONSTRUCTOR_ARGUMENTS = './test/files/constructor-arguments.idl';
const CONSTRUCTOR_NO_ARGS = './test/files/constructor-noarguments.idl';
const CONSTRUCTOR_ONE_ARGUMENT = './test/files/constructor-1-argument.idl';
const DELETERS = './test/files/all-deleters.idl';
const EVENTHANDLERS = './test/files/all-event-handlers.idl';
const EXPOSED_MANY = './test/files/exposed-many.idl';
const EXPOSED_ONE = './test/files/exposed-one.idl';
const FLAGGED_MEMBERS = './test/files/flagged-members.idl';
const GETTERS_BOTH = './test/files/getters-both.idl';
const GETTERS_NAMED_ONLY = './test/files/getters-named-only.idl';
const GETTERS_UNNAMED_ONLY = './test/files/getters-unnamed-only.idl';
const INTERFACE_PARENT = './test/files/interface-parent.idl';
const INTERFACE_NOPARENT = './test/files/interface-noparent.idl';
const ITERABLE_MULTI_ARG_SEQ = './test/files/iterable-multi-arg-sequence.idl';
const ITERABLE_MULTI_ARG = './test/files/iterable-multi-arg.idl';
const ITERABLE_ONE_ARG = './test/files/iterable-one-arg.idl';
const ITERABLE_SEQUENCE_ARG = './test/files/iterable-sequence-arg.idl';
const METHOD_ARGUMENTS_COUNT = './test/files/method-argument-count.idl';
const METHOD_NO_ARGUMENTS = './test/files/method-noarguments.idl';
const METHOD_PROMISES = './test/files/method-promises.idl';
const METHOD_PROMISE_RESOLUTION = './test/files/method-promise-resolution.idl';
const METHOD_PROMISE_VOID = './test/files/method-promise-void.idl';
const METHOD_SYNCHRONOUS = './test/files/method-synchronous.idl';
const PROPERTIES_BASIC = './test/files/properties-basic.idl';
const PROPERTIES_EVENTHANDLER = './test/files/properties-eventhandler.idl';
const PROPERTIES_MAPLIKE = './test/files/properties-maplike.idl';
const PROPERTIES_MAPLIKE_READONLY = './test/files/properties-maplike-readonly.idl';
const RUNTIMEENABLED_IFACE_EXPER_RE = './test/files/runtimeenabled-interface-exper.idl';
const RUNTIMEENABLED_IFACE_MISSING_RE = './test/files/runtimeenabled-interface-missing.idl';
const RUNTIMEENABLED_IFACE_OT_RE = './test/files/runtimeenabled-interface-ot.idl';
const SECURE_CONTEXT = './test/files/secure-context.idl';
const SETTERS_BOTH = './test/files/setters-both.idl';
const SETTERS_NAMED_ONLY = './test/files/setters-named-only.idl';
const SETTERS_UNNAMED_ONLY = './test/files/setters-unnamed-only.idl';

const NO_CONSTRUCTOR = './test/files/no-constructor.idl';
const NO_DELETERS = './test/files/no-deleters.idl';
const NO_EVENTHANDLERS = './test/files/no-event-handlers.idl';
const NO_GETTERS = './test/files/no-getters.idl';
const NO_ITERABLE = './test/files/no-iterable.idl';
const NO_SETTERS = './test/files/no-setters.idl';

const UNNAMED_MEMBER = '';

describe('InterfaceData', () => {+
  describe('Member flags', () => {
    it('Confirms that all flagged members return true for .flagged', () => {
      const id = new InterfaceData(FLAGGED_MEMBERS);
      const members = [
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
      let foundIncorrect = {};
      let passFail = members.every(memberName => {
        let member = id[memberName];
        return member.every(elem => {
          if (!elem.flagged) { foundIncorrect = `${memberName} ${JSON.stringify(elem)}`; }
          return elem.flagged
        });
      });
      assert.ok(passFail, foundIncorrect);
    });
  });

  describe('constructors', () => {
    it('Confirms that constructors returns null when no constructors are present', () => {
      const id = new InterfaceData(NO_CONSTRUCTOR);
      assert.equal(id.constructors.length, 0);
    });
    it('Confirms that a constructor without arguments can be found', () => {
      const id = new InterfaceData(CONSTRUCTOR_NO_ARGS);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length === 0;
      });
      assert.equal(found.arguments.length, 0, JSON.stringify(found));
    });
    it('Confirms that a constructor with one argument can be found', () => {
      const id = new InterfaceData(CONSTRUCTOR_ONE_ARGUMENT);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length === 1;
      });
      assert.equal(found.arguments.length, 1, JSON.stringify(found));
    })
    it('Confirms that a constructor with arguments can be found', () => {
      const id = new InterfaceData(CONSTRUCTOR_ARGUMENTS);
      const constructors = id.constructors;
      const found = constructors.find(elem => {
        return elem.arguments.length > 0;
      });
      assert.equal(found.arguments.length, 3, JSON.stringify(found));
    });
    it('Confirms that all constructor interfacess are counted', () => {
      const id = new InterfaceData(CONSTRUCTORS);
      assert.equal(id.constructors.length, 2);
    });
  });

  describe('deleters', () => {
    it('Confirms that all known variations of deleter IDL are counted', () => {
      const id = new InterfaceData(DELETERS);
      assert.equal(id.deleters.length, 4);
    });
    it('Confirms that null is returned when there are no deleters', () => {
      const id = new InterfaceData(NO_DELETERS);
      assert.equal(id.deleters.length, 0);
    });
    it('Confirms that an unnamed deleter is processed from the IDL file', () => {
      const id = new InterfaceData(DELETERS);
      const found = id.deleters.some(elem => {
        return elem.name == UNNAMED_MEMBER;
      });
    });
  });

  describe('eventHandlers', () => {
    it('Confirms that all known variations of EventHandler IDL are counted', () => {
      const id = new InterfaceData(EVENTHANDLERS);
      assert.equal(id.eventHandlers.length, 3);
    });
    it('Confirms that null is returned when there are no event handlers', () => {
      const id = new InterfaceData(NO_EVENTHANDLERS);
      assert.equal(id.eventHandlers.length, 0);
    });
  });

  describe('exposed', () => {
    it('Confirms one exposed interface is returned', () => {
      const id = new InterfaceData(EXPOSED_ONE);
      assert.equal(id.exposed.length, 1);
    });
    it('Confirms multiple exposed interfaces are returned', () => {
      const id = new InterfaceData(EXPOSED_MANY);
      assert.equal(id.exposed.length, 2);
    });
  });

  describe('flagged', () => {
    it('Confirms that flagged returns a boolean', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(typeof id.flagged === "boolean");
    });
    it('Confirms that false is returned when the flag name is not found', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(!id.flagged);
    });
    it('Confirms that true is returned when the flag name is found', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_EXPER_RE);
      assert.ok(id.flagged);
    });
  });

  describe('getters', () => {
    it('Confirms that getter returns returns all named and unnamed getters', () => {
      const id = new InterfaceData(GETTERS_BOTH);
      assert.ok(id.getters.length === 3);
    });
    it('Confirms that getter returns all getters when file contains only an unnamed getter', () => {
      const id = new InterfaceData(GETTERS_UNNAMED_ONLY);
      assert.ok(id.getters.length === 1);
    });
    it('Confirms that getter returns null when file contains no getters', () => {
      const id = new InterfaceData(NO_GETTERS);
      assert.ok(id.getters.length === 0);
    });
  });

  describe('hasConstructor', () => {
    it('Confirms that hasConstructor returns false when a constructor is missing', () => {
      const id = new InterfaceData(NO_CONSTRUCTOR);
      assert.ok(id.hasConstructor === false);
    });
    it('Confirms that hasConstructor returns true when a constructor is present', () => {
      const id = new InterfaceData(CONSTRUCTOR_NO_ARGS);
      assert.ok(id.hasConstructor === true);
    });
  });

  describe('iterable', () => {
    it('Confirms that an iterable with a sequence as one of several args is recognized', () => {
      const id = new InterfaceData(ITERABLE_MULTI_ARG_SEQ);
      assert.equal(id.iterable[0].arguments[1], 'sequence<CSSStyleValue>');
    });
    it('Confirms that an iterable with one arg is recognized', () => {
      const id = new InterfaceData(ITERABLE_ONE_ARG);
      assert.equal(id.iterable[0].arguments.length, 1);
    });
    it('Confirms that an iterable with several args is recognized', () => {
      const id = new InterfaceData(ITERABLE_MULTI_ARG);
      assert.equal(id.iterable[0].arguments.length, 2);
    });
    it('Confirms that an iterable with a sequence as its one arg is recognized', () => {
      const id = new InterfaceData(ITERABLE_SEQUENCE_ARG);
      assert.equal(id.iterable[0].arguments[0], 'sequence<CSSStyleValue>');
    });
    it('Confirms that iterable returns an empty array when the IDL contains no iterable', () => {
      const id = new InterfaceData(NO_ITERABLE);
      assert.equal(id.iterable.length, 0);
    });
  });

  // Needs to read out of a test file that contains methods.
  describe('maplikeMethods', () => {
    it('Confirms that only readonly properties are returned', () => {
      const id = new InterfaceData(PROPERTIES_MAPLIKE_READONLY);
      assert.equal(id.maplikeMethods.length, 7);
    });
    it('Confirms that all methods are returned', () => {
      const id = new InterfaceData(PROPERTIES_MAPLIKE);
      assert.equal(id.maplikeMethods.length, 10);
    });
  });

  describe('methods', () => {
    it('Confirms that the correct number of promise-based methods are returned', () => {
      const id = new InterfaceData(METHOD_PROMISES);
      assert.equal(id.methods.length, 4);
    });
    it('Confirms that the correct number of synchronous methods are returned', () => {
      const id = new InterfaceData(METHOD_SYNCHRONOUS);
      assert.equal(id.methods.length, 2);
    });
    it('Confirms that methods with arguments are found', () => {
      const id = new InterfaceData(METHOD_SYNCHRONOUS);
      let methodsWithArguments = 0;
      id.methods.forEach(method => {
        if (method.arguments.length > 0) { methodsWithArguments++; }
      });
      assert.equal(methodsWithArguments, 1);
    });
    it('Confirms that methods without arguments are found', () => {
      const id = new InterfaceData(METHOD_SYNCHRONOUS);
      let methodsWithoutArguments = 0;
      id.methods.forEach(method => {
        if (method.arguments.length == 0) { methodsWithoutArguments++; }
      });
      assert.equal(methodsWithoutArguments, 1);
    });
    it('Confirms that method.args returns the correct number of args, when present', () => {
      const id = new InterfaceData(METHOD_ARGUMENTS_COUNT);
      assert.equal(id.methods[0].arguments.length, 2);
    });
    it('Confirms that method.args equals 0 when there are no args present', () => {
      const id = new InterfaceData(METHOD_NO_ARGUMENTS);
      assert.equal(id.methods[0].arguments.length, 0);
    });
    it('Confirms that method.resolutions returns a value', () => {
      const id = new InterfaceData(METHOD_PROMISE_RESOLUTION);
      assert.equal(id.methods[0].resolution, "DOMString");
    });
    it('Confirms that method.resolutions returns "void"', () => {
      const id = new InterfaceData(METHOD_PROMISE_VOID);
      assert.equal(id.methods[0].resolution, "void");
    });
  });

  describe('namedGetters', () => {
    it('Confirms that named getters returns items when file contains named and unnamed getters', () => {
      const id = new InterfaceData(GETTERS_BOTH);
      assert.equal(id.namedGetters.length, 2);
    });
    it('Confirms that named getters returns items when file contains only named getters', () => {
      const id = new InterfaceData(GETTERS_NAMED_ONLY);
      assert.ok(id.namedGetters.length > 0);
    });
    it('Confirms that named getters returns no items when file contains no named getters', () => {
      const id = new InterfaceData(GETTERS_UNNAMED_ONLY);
      assert.equal(id.namedGetters.length, 0);
    });
  });


  describe('namedSetters', () => {
    it('Confirms that namedSetters returns items when file contains named and unnamed getters', () => {
      const id = new InterfaceData(SETTERS_BOTH);
      assert.equal(id.namedSetters.length, 1);
    });
    it('Confirms that namedSetters returns items when file contains only named getters', () => {
      const id = new InterfaceData(SETTERS_NAMED_ONLY);
      assert.equal(id.namedSetters.length, 1);
    });
    it('Confirms that namedSetters returns no items when file contains no named getters', () => {
      const id = new InterfaceData(SETTERS_UNNAMED_ONLY);
      assert.equal(id.namedSetters.length, 0);
    });
  });
  
  describe('originTrial', () => {
    it('Confirms that originTrial returns a boolean', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(typeof id.originTrial === "boolean");
    });
    it('Confirms that false is returned when the origin trial name is not found', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_MISSING_RE);
      assert.ok(!id.originTrial);
    });
    it('Confirms that true is returned when the origin trial name is found', () => {
      const id = new InterfaceData(RUNTIMEENABLED_IFACE_OT_RE);
      assert.ok(id.originTrial);
    });
  });

  describe('parentClass', () => {
    it('Confirms that the name of a parent class is returned if present', () => {
      const id = new InterfaceData(INTERFACE_PARENT);
      assert.equal(id.parentClass, "EventTarget");
    });
    it('Confirms that null is returned if an interface has no parent class', () => {
      const id = new InterfaceData(INTERFACE_NOPARENT);
      assert.equal(id.parentClass, null);
    })
  });
  
  describe('properties', () => {
    it('Confirms that all basic properties are counted', () => {
      const id = new InterfaceData(PROPERTIES_BASIC);
      assert.equal(id.properties.length, 2);
    });
    it('Confirms that eventHandler is excluded', () => {
      const id = new InterfaceData(PROPERTIES_EVENTHANDLER);
      assert.equal(id.properties.length, 2);
    });
    it('Confirms that return type is recorded', () => {
      const id = new InterfaceData(PROPERTIES_BASIC);
      const properties = id.properties;
      assert.equal(id.properties[0].returnType, 'FontFaceLoadStatus');
    });
  });

  describe('readOnlyProperties', () => {
    it ('Confirms that all readonly properties are counted', () => {
      const id = new InterfaceData(PROPERTIES_BASIC);
      assert.equal(id.readOnlyProperties.length, 1);
    });
  });

  describe('readWriteProperties', () => {
    it ('Confirms that all read/write properties are counted', () => {
      const id = new InterfaceData(PROPERTIES_BASIC);
      assert.equal(id.readWriteProperties.length, 1);
    });
  });

  describe('secureContext', () => {
    it('Confirms that secureContext returns true when present', () => {
      const id = new InterfaceData(SECURE_CONTEXT);
      assert.ok(id.secureContext);
    });
    it('Confirms that secureContext returns false when not present', () => {
      const id = new InterfaceData(EXPOSED_ONE);
      assert.ok(!id.secureContext);
    });
  });

  describe('setters', () => {
    it('Confirms that setters returns both named and unnamed setters', () => {
      const id = new InterfaceData(SETTERS_BOTH);
      assert.equal(id.setters.length, 2);
    });
    it('Confirms that setters returns values when file contains only an unnamed setters', () => {
      const id = new InterfaceData(SETTERS_UNNAMED_ONLY);
      assert.equal(id.setters.length, 1);
    });
    it('Confirms that setters returns values when file contains only named setters', () => {
      const id = new InterfaceData(SETTERS_NAMED_ONLY);
      assert.equal(id.setters.length, 1);
    });
    it('Confirms that no setters are returned when file contains no setters', () => {
      const id = new InterfaceData(NO_SETTERS);
      assert.equal(id.setters.length, 0);
    });
  });

  describe('signatures', () => {
    it('Confirms that signatures returns an array', () => {
      const id = new InterfaceData(CONSTRUCTORS);
      assert.ok(Array.isArray(id.signatures));
    });
  });

  describe('unnamedGetters', () => {
    it('Confirms that unnamedGetters returns an object when file contains named and unnamed getters', () => {
      const id = new InterfaceData(GETTERS_BOTH);
      assert.equal(id.unnamedGetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
    it('Confirms that unnamedGetters returns no object when file contains only named getters', () => {
      const id = new InterfaceData(GETTERS_NAMED_ONLY);
      assert.equal(id.unnamedGetter.length, 0, JSON.stringify(id.unnamedGetter))
    });
    it('Confirms that an object is returned when file contains only an unamedGetter', () => {
      const id = new InterfaceData(GETTERS_UNNAMED_ONLY);
      assert.equal(id.unnamedGetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
  });

  describe('unnamedSetters', () => {
    it('Confirms that unnamedSetters returns an object when file contains named and unnamed setters', () => {
      const id = new InterfaceData(SETTERS_BOTH);
      assert.equal(id.unnamedSetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
    it('Confirms that unnamedSetters returns no object when file contains only named Setters', () => {
      const id = new InterfaceData(SETTERS_NAMED_ONLY);
      assert.equal(id.unnamedSetter.length, 0, JSON.stringify(id.unnamedGetter))
    });
    it('Confirms that an object is returned when file contains only an unamedSetter', () => {
      const id = new InterfaceData(SETTERS_UNNAMED_ONLY);
      assert.equal(id.unnamedSetter.length, 1, JSON.stringify(id.unnamedGetter));
    });
  });
});