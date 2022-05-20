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

global.__commandName = 'test';

const COMMENTS = './test/files/comments.idl';
const COMMENTS_CLEANED = './test/files/comments-cleaned.idl';
const TYPEDEF_MULTILINE = './test/files/typedef-multiline.idl';

const assert = require('assert');
const fs = require('fs');

const utils = require('../utils.js');

describe('Utils', () => {
  describe('getAlternateKey()', () => {
    it('Verifies that alternate keys are returned', () => {
      const key = 'WebGLColorBufferFloat';
      const altKey = 'WEBGL_color_buffer_float';
      let retrievedKey = utils.getAlternateKey(key);
      assert.strictEqual(altKey, retrievedKey);
    });
  });

  describe('getIDLFile()', () => {
    it('Verifies that all possible comments and whitespace are removed', () => {
      let buffer = fs.readFileSync(COMMENTS_CLEANED);
      const comparisonFile = buffer.toString();
      const options = { "clean": true }
      const cleanedFile = utils.getIDLFile(COMMENTS, options);
      assert.strictEqual(cleanedFile, comparisonFile);
    });
    it('Verifies multi-line typedef structures are flattened', () => {
      const ExpectedResult = 'typedef (CSSImageValue or HTMLImageElement or SVGImageElement or HTMLVideoElement or HTMLCanvasElement or ImageBitmap or OffscreenCanvas or VideoFrame) CanvasImageSource;';
      const options = { clean: true };
      const cleanedFile = utils.getIDLFile(TYPEDEF_MULTILINE, options);
      assert.strictEqual(cleanedFile, ExpectedResult);
    });
  });

  describe('getTemplate()', () => {
    it('Verifies that the default path is used', () => {
      let foundErr;
      try {
        const wireframes = utils.getTemplate('interface.md');
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof Error));
    });
    it('Verifies that a specified path may be used', () => {
      let foundErr;
      try {
        const templatePath = `${__dirname}/templates/experimental`;
        const wireframes = utils.getTemplate('interface.md');
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof Error));
    });
  });

  describe('getWireframes()', () => {
    it('Verifies that the correct path is used', () => {
      let foundErr;
      try {
        const wireframes = utils.getWireframes();
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof Error));
    });
  });

  describe('haveTemplate()', () => {
    it('Verifies that the default path is used', () => {
      let foundErr;
      try {
        const wireframes = utils.haveTemplate('interface');
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof Error));
    });
    it('Verifies that a specified path may be used', () => {
      let foundErr;
      try {
        const templatePath = `${__dirname}/templates/experimental`;
        const wireframes = utils.haveTemplate('interface');
      } catch (error) {
        foundErr = error;
        console.log(error);
      }
      assert.ok(!(foundErr instanceof Error));
    });
  });
});