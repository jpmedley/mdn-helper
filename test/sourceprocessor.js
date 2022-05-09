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

const { ChromeIDLSource } = require('../sourceprocessor.js');

const TEST_IDL_FILES = './test/files/';
const CALLBACK = `${TEST_IDL_FILES}callback.idl`;
const CALLBACK_COMPLEX = `${TEST_IDL_FILES}callback-complex.idl`;
const CALLBACK_PROMISE = `${TEST_IDL_FILES}callback-promise.idl`;
const DICTIONARY = `${TEST_IDL_FILES}dictionary.idl`;
const DICTIONARY_ANCESTOR = `${TEST_IDL_FILES}dictionary-ancestor.idl`;
const DICTIONARY_EXTENDED_ATTRIBS = `${TEST_IDL_FILES}dictionary-extended-attribs.idl`;
const ENUM = `${TEST_IDL_FILES}enum.idl`;
const INCLUDES_FLASE_POSITIVE = `${TEST_IDL_FILES}includes-false-positive.idl`;
const INTERFACE_CALLBACK = `${TEST_IDL_FILES}interface-callback.idl`;
const INTERFACE_COMPLETE = `${TEST_IDL_FILES}interface-complete.idl`;
const INTERFACE_EXTENDED_ATTRIBS = `${TEST_IDL_FILES}interface-flag-and-ot.idl`;
const INTERFACE_MIXIN = `${TEST_IDL_FILES}interface-mixin.idl`;
const INTERFACE_MULTISTRUCTURE = `${TEST_IDL_FILES}multiple-structures-same.idl`
const INTERFACE_PARTIAL = `${TEST_IDL_FILES}interface-partial.idl`;
const INTERFACE_VESTIGIAL = `${TEST_IDL_FILES}interface-vestigial.idl`;
const INTERFACE_ODD_BRACKET_POS = `${TEST_IDL_FILES}interface-odd-bracket-pos.idl`;
const MIXIN_INCLUDES = `${TEST_IDL_FILES}mixin-includes.idl`;
const MIXIN_INCLUDES_MULTIPLE = `${TEST_IDL_FILES}mixin-includes-multiple.idl`;
const MULTIPLE_CALLBACKS = `${TEST_IDL_FILES}multiple-callbacks.idl`;
const MULTIPLE_DICTIONARIES = `${TEST_IDL_FILES}multiple-dictionaries.idl`;
const MULTIPLE_ENUMS = `${TEST_IDL_FILES}multiple-enums.idl`;
const MULTIPLE_STRUCTURES = `${TEST_IDL_FILES}multiple-structures.idl`;
const MULTIPLE_TYPEDEFS = `${TEST_IDL_FILES}multiple-typedefs.idl`;
const NAMESPACE_SIMPLE = `${TEST_IDL_FILES}namespace.idl`;
const NAMESPACE_PARTIAL = `${TEST_IDL_FILES}namespace-partial.idl`;
const TYPEDEF_SIMPLE = `${TEST_IDL_FILES}typedef-simple.idl`;

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('ChromeIDLSource', () => {
  describe('getFeatureSources()', () => {
    it('Confirms that a complete directory can be processed', () => {
      const cis = new ChromeIDLSource('./idl/');
      const sources = cis.getFeatureSources();
      assert.ok(sources.size > 0);
    });

    it ('Confirms that files with multiple structures are processed', () => {
      const cis = new ChromeIDLSource(MULTIPLE_STRUCTURES);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 8);
    });

    it('Confirms that all callbacks are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_CALLBACKS);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that callback names are recorded correctly', () => {
      const cis = new ChromeIDLSource(CALLBACK);
      const sources = cis.getFeatureSources();
      const source = sources.get('DecodeErrorCallback-callback');
      assert.strictEqual(source.name, 'DecodeErrorCallback');
    });

    it('Confirms that names of callbacks with complicated definitions are recorded correctly', () => {
      const cis = new ChromeIDLSource(CALLBACK_COMPLEX);
      const sources = cis.getFeatureSources();
      const source = sources.get('CallbackComplex-callback');
      assert.strictEqual(source.name, 'CallbackComplex');
    });

    it('Confirms that a callback with a promise is processed correctly', () => {
      const cis = new ChromeIDLSource(CALLBACK_PROMISE);
      const sources = cis.getFeatureSources();
      const source = sources.get(`CallbackPromise-callback`);
      assert.strictEqual(source.name, 'CallbackPromise');
    })

    it('Confirms that all dictionaries are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_DICTIONARIES);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that dictionary names are recorded correctly', () => {
      const cis = new ChromeIDLSource(DICTIONARY);
      const sources = cis.getFeatureSources();
      const source = sources.get('USBDeviceFilter-dictionary');
      assert.strictEqual(source.name, 'USBDeviceFilter');
    });

    it('Confirms that a dictionary with extended attributes is processed', () => {
      const cis = new ChromeIDLSource(DICTIONARY_EXTENDED_ATTRIBS);
      const sources = cis.getFeatureSources();
      // Test should be based on extened attributes
      assert.ok(sources.has('DictionaryExtendedAttribs-dictionary'));
    });

    it('Confirms that a child dictionary is processed', () => {
      const cis = new ChromeIDLSource(DICTIONARY_ANCESTOR);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('ChildDictionary-dictionary'));
    });

    it('Confirms that an interface name is recorded correctly', () => {
      const cis = new ChromeIDLSource(INTERFACE_COMPLETE);
      const sources = cis.getFeatureSources();
      const source = sources.get('InterfaceComplete-partial');
      assert.strictEqual(source.name, 'InterfaceComplete');
    });

    it('Confirms that an interface with extended attributes is processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_EXTENDED_ATTRIBS);
      const sources = cis.getFeatureSources();
      // Test should be based on extened attributes
      assert.ok(sources.has('InterfaceFlagOT-interface'));
    })

    it('Confirms that callback interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_CALLBACK);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('InterfaceCallback-callback-interface'));
    });

    it('Confirms that mixin interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_MIXIN);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('InterfaceMixin-mixin'));
    });

    it('Confirms that the right interface name is returned for a mixin', () => {
      const cis = new ChromeIDLSource(INTERFACE_MIXIN);
      const sources = cis.getFeatureSources();
      const source = sources.entries().next();
      assert.strictEqual(source.value[1].name, 'InterfaceMixin');
    });

    it('Confirms that the right interface key is returned for a mixin', () => {
      const cis = new ChromeIDLSource(INTERFACE_MIXIN);
      const sources = cis.getFeatureSources();
      const source = sources.entries().next();
      assert.strictEqual(source.value[1].key, 'InterfaceMixin');
    });

    it('Confirms retrieval of interface from multi-structure file', () => {
      const cis = new ChromeIDLSource(INTERFACE_MULTISTRUCTURE);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('SameName-interface'));
    });

    it('Confirms that partial interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_PARTIAL);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('InterfacePartial-partial'));
    });

    it('Confirms that vestigial interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_VESTIGIAL);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('Vestigial-interface'));
    });

    it('Confirms that an interface with a misplaced bracket is processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_ODD_BRACKET_POS);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('OddBracketPos-partial'));
    })

    it('Confirms that all includes are counted', () => {
      const cis = new ChromeIDLSource(MIXIN_INCLUDES_MULTIPLE);
      const sources = cis.getFeatureSources();
      let includeCount = 0;
      sources.forEach((val, key, map) => {
        if (val.type === 'includes') { includeCount++; }
      });
      assert.strictEqual(includeCount, 2);
    });

    it('Confirms that includes names are recorded correctly', () => {
      const cis = new ChromeIDLSource(MIXIN_INCLUDES);
      const sources = cis.getFeatureSources();
      const source = sources.get('Including-includes');
      assert.strictEqual(source.name, 'Including');
    });

    it('Confirms that a false positive \'includes\' is not returned', () => {
      const cis = new ChromeIDLSource(INCLUDES_FLASE_POSITIVE);
      let foundErr;
      try {
        const sources = cis.getFeatureSources();
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof IDLError));
    });

    it('Confirms that namespace names are recorded correctly', () => {
      const cis = new ChromeIDLSource(NAMESPACE_SIMPLE);
      const sources = cis.getFeatureSources();
      const source = sources.get('NamespaceName-namespace');
      assert.strictEqual(source.name, 'NamespaceName');
    });

    it('Confirms that partial namespace names are recorded correctly', () => {
      const cis = new ChromeIDLSource(NAMESPACE_PARTIAL);
      const sources = cis.getFeatureSources();
      const source = sources.get('PartialNamespaceName-namespace');
      assert.strictEqual(source.name, 'PartialNamespaceName');
    });
  });

  describe('getFeatureSources() enum tests', () => {
    it('Confirms that all enums are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_ENUMS);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that enum names are recorded correctly', () => {
      const cis = new ChromeIDLSource(ENUM);
      const sources = cis.getFeatureSources();
      const source = sources.get('AudioContextState-enum');
      assert.strictEqual(source.name, 'AudioContextState');
    });
  });

  describe('getFeatureSources() typedef tests', () => {
    it('Confirms that typedef names are recorded correctly', () => {
      const cis = new ChromeIDLSource(TYPEDEF_SIMPLE);
      const sources = cis.getFeatureSources();
      const source = sources.get('TypeDefName-typedef');
      assert.strictEqual(source.name, 'TypeDefName');
    });
  });

  describe('type', () => {
    it('Confirms that a namespace input produces a SourceRecord with correct type', () => {
      const cis = new ChromeIDLSource(NAMESPACE_SIMPLE);
      const sources = cis.getFeatureSources();
      const source = sources.get('NamespaceName-namespace');
      assert.strictEqual(source.type, 'namespace');
    });
  });
});