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

const { ChromeIDLSource } = require('../sourceprocessor.js');

const TEST_IDL_FILES = './test/files/';
const CALLBACK = `${TEST_IDL_FILES}callback.idl`;
const DICTIONARY = `${TEST_IDL_FILES}dictionary.idl`;
const ENUM = `${TEST_IDL_FILES}enum.idl`;
const INTERFACE_CALLBACK = `${TEST_IDL_FILES}interface-callback.idl`;
const INTERFACE_COMPLETE = `${TEST_IDL_FILES}interface-complete.idl`;
const INTERFACE_MIXIN = `${TEST_IDL_FILES}interface-mixin.idl`
const INTERFACE_PARTIAL = `${TEST_IDL_FILES}interface-partial.idl`;
const MIXIN_INCLUDES = `${TEST_IDL_FILES}mixin-includes.idl`;
const MIXIN_INCLUDES_MULTIPLE = `${TEST_IDL_FILES}mixin-includes-multiple.idl`;
const MULTIPLE_CALLBACKS = `${TEST_IDL_FILES}multiple-callbacks.idl`;
const MULTIPLE_DICTIONARIES = `${TEST_IDL_FILES}multiple-dictionaries.idl`;
const MULTIPLE_ENUMS = `${TEST_IDL_FILES}multiple-enums.idl`;
const MULTIPLE_STRUCTURES = `${TEST_IDL_FILES}multiple-structures.idl`;

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

describe('ChromeIDLSource', () => {
  describe('getFeatureSources()', () => {
    it ('Confirms that files with multiple structures are processed', () => {
      const cis = new ChromeIDLSource(MULTIPLE_STRUCTURES);
    });

    it('Confirms that all callbacks are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_CALLBACKS);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that callback names are recorded correctly', () => {
      const cis = new ChromeIDLSource(CALLBACK);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('DecodeErrorCallback'));
    });

    it('Confirms that all dictionaries are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_DICTIONARIES);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that dictionary names are recorded correctly', () => {
      const cis = new ChromeIDLSource(DICTIONARY);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('USBDeviceFilter'));
    });

    it('Confirms that all enums are counted', () => {
      const cis = new ChromeIDLSource(MULTIPLE_ENUMS);
      const sources = cis.getFeatureSources();
      assert.strictEqual(sources?.size, 2);
    });

    it('Confirms that enum names are recorded correctly', () => {
      const cis = new ChromeIDLSource(ENUM);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('AudioContextState'));
    });

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
      assert.ok(sources.has('Including'));
    });

    it('Confirms that an interface name is recorded correctly', () => {
      const cis = new ChromeIDLSource(INTERFACE_COMPLETE);
      const sources = cis.getFeatureSources();
      assert.ok(sources.has('InterfaceComplete'));
    });

    it('Confirms that callback interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_CALLBACK);
      const sources = cis.getFeatureSources();
      const source = sources.get('InterfaceCallback');
      assert.strictEqual(source.type, 'callback');
    });

    it('Confirms that mixin interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_MIXIN);
      const sources = cis.getFeatureSources();
      const source = sources.get('InterfaceMixin');
      assert.strictEqual(source.type, 'mixin');
    });

    it('Confirms that partial interfaces are processed', () => {
      const cis = new ChromeIDLSource(INTERFACE_PARTIAL);
      const sources = cis.getFeatureSources();
      const source = sources.get('InterfacePartial');
      assert.strictEqual(source.type, 'partial');
    });
  });
});