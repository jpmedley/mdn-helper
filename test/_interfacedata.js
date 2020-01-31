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
const webidl2 = require('webidl2');

const { InterfaceData } = require('../__interfacedata.js');
const { initiateLogger } = require('../log.js');

initiateLogger();

const DELETERS = './test/files/all-deleters.idl';
const EVENTHANDLERS = './test/files/all-event-handlers.idl';
const CONSTRUCTORS = './test/files/all-constructors.idl';
const CONSTRUCTOR_NO_ARGS = './test/files/constructor-noarguments.idl';
const CONSTRUCTOR_ARGUMENTS = './test/files/constructor-arguments.idl';
const GETTERS_BOTH = './test/files/getters-both.idl';
const GETTERS_NAMED_ONLY = './test/files/getters-named-only.idl';
const GETTERS_UNNAMED_ONLY = './test/files/getters-unnamed-only.idl';
const ITERABLE_MULTI_ARG_SEQ = './test/files/iterable-multi-arg-sequence.idl';
const ITERABLE_MULTI_ARG = './test/files/iterable-multi-arg.idl';
const ITERABLE_ONE_ARG = './test/files/iterable-one-arg.idl';
const ITERABLE_SEQUENCE_ARG = './test/files/iterable-sequence-arg.idl';

const NO_CONSTRUCTOR = './test/files/no-constructor.idl';
const NO_DELETERS = './test/files/no-deleters.idl';
const NO_EVENTHANDLERS = './test/files/no-event-handlers.idl';
const NO_GETTERS = './test/files/no-getters.idl';
const NO_ITERABLE = './test/files/no-iterable.idl';

const UNNAMED_MEMBER = '';

function loadSource(sourcePath) {
  let sourceContents = utils.getIDLFile(sourcePath);
  let sourceTree;
  try {
    // Use webidl2 only for crude validation.
    sourceTree = webidl2.parse(sourceContents);
  } catch(e) {
    // if (e instanceof SyntaxError) {
    //   global.__logger.info(`Unable to parse ${sourcePath}.`);
    // }
    global.__logger.error(e.message);
    throw e;
  } finally {
    sourceTree = null;
  }
  return sourceContents;
}

// To Do: Account for runtime flags

describe('InterfaceData', () => {

  describe('constructors', () => {
    it('Confirms that constructors returns null when no constructors are present', () => {
      const source = loadSource(NO_CONSTRUCTOR);
      const id = new InterfaceData(source);
      assert.equal(id.constructors, null);
    });
    it('Confirms that a constructor without arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const id = new InterfaceData(source);
      assert.equal(id.constructors.length, 1);
    });
    it('Confirms that a constructor with arguments can be found', () => {
      const source = loadSource(CONSTRUCTOR_ARGUMENTS);
      const id = new InterfaceData(source);
      assert.equal(id.constructors.length, 1);
    });
    it('Confirms that all constructor interfacess are counted', () => {
      const source = loadSource(CONSTRUCTORS);
      const id = new InterfaceData(source);
      assert.equal(id.constructors.length, 3);
    })
  });

  describe('deleters', () => {
    it('Confirms that all known variations of deleter IDL are counted', () => {
      const source = loadSource(DELETERS);
      const id = new InterfaceData(source);
      assert.equal(id.deleters.length, 4);
    });
    it('Confirms that null is returned when there are no deleters', () => {
      const source = loadSource(NO_DELETERS);
      const id = new InterfaceData(source);
      assert.equal(id.deleters, null);
    });
    it('Confirms that an unnamed deleter is processed from the IDL file', () => {
      const source = loadSource(DELETERS);
      const id = new InterfaceData(source);
      assert.ok(id.deleters.includes(UNNAMED_MEMBER));
    });
  });

  describe('eventHandlers', () => {
    it('Confirms that all known variations of EventHandler IDL are counted', () => {
      const source = loadSource(EVENTHANDLERS);
      const id = new InterfaceData(source);
      assert.equal(id.eventHandlers.length, 3);
    });
    it('Confirms that null is returned when there are no event handlers', () => {
      const source = loadSource(NO_EVENTHANDLERS);
      const id = new InterfaceData(source);
      assert.equal(id.eventHandlers, null);
    });
  });

  describe('getter', () => {
    it('Confirms that getter returns true when file contains named and unnamed getters', () => {
      const source = loadSource(GETTERS_BOTH);
      const id = new InterfaceData(source);
      assert.ok(id.getter);
    });
    it('Confirms that getter returns true when file contains only an unnamed getter', () => {
      const source = loadSource(GETTERS_UNNAMED_ONLY);
      const id = new InterfaceData(source);
      assert.ok(id.getter);
    });
    it('Confirms that getter returns false when file contains only named getters', () => {
      const source = loadSource(GETTERS_NAMED_ONLY);
      const id = new InterfaceData(source);
      assert.ok(id.getter === false);
    });
    it('Cofirms that getter returns false when file contains no getters', () => {
      const source = loadSource(NO_GETTERS);
      const id = new InterfaceData(source);
      assert.ok(id.getter === false);
    });
  });

  describe('hasConstructor', () => {
    it('Confirms that hasConstructor returns false when a constructor is missing', () => {
      const source = loadSource(NO_CONSTRUCTOR);
      const id = new InterfaceData(source);
      assert.ok(id.hasConstructor === false);
    });
    it('Confirms that hasConstructor returns true when a constructor is present', () => {
      const source = loadSource(CONSTRUCTOR_NO_ARGS);
      const id = new InterfaceData(source);
      assert.ok(id.hasConstructor === true);
    });
  });

  describe('iterable', () => {
    it('Confirms that an iterable with a sequence as one of several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG_SEQ);
      const id = new InterfaceData(source);
      assert.ok(id.iterable);
    });
    it('Confirms that an iterable with several args is recognized', () => {
      const source = loadSource(ITERABLE_MULTI_ARG);
      const id = new InterfaceData(source);
      assert.ok(id.iterable);
    });
    it('Confirms that an iterable with one arg is recognized', () => {
      const source = loadSource(ITERABLE_ONE_ARG);
      const id = new InterfaceData(source);
      assert.ok(id.iterable);
    });
    it('Confirms that an iterable with a sequence as its one arg is recognized', () => {
      const source = loadSource(ITERABLE_SEQUENCE_ARG);
      const id = new InterfaceData(source);
      assert.ok(id.iterable);
    });
    it('Confirms that iterable returns false when the IDL contains no iterable', () => {
      const source = loadSource(NO_ITERABLE);
      const id = new InterfaceData(source);
      assert.ok(id.iterable === false);
    });
  });

  describe('members', () => {
    it('Confirms that named getters are returned with other members', () => {
      
    });
  });
})