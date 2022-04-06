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

const INTERFACE_PARENT_RE = './test/files/interface-parent.idl';
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
    it('Confirms that all ids for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const ids = sr.getAllIds();
      assert.strictEqual(ids.length, 2);
    })
  });

  describe('getKeys()', () => {
    it('Confirms that all keys for a source IDL are returned', () => {
      const source = loadSource(SIMPLE_SOURCE);
      const sr = new SourceRecord('urls', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      const ids = sr.getKeys();
      assert.strictEqual(ids.length, 3);
    });
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
      const source = loadSource(INTERFACE_PARENT_RE);
      const sr = new SourceRecord('parent-interface', 'interface', { path: SIMPLE_SOURCE, sourceIdl: source });
      assert.strictEqual(sr.interfaceName, 'InterfaceParent');
    })
  });
});