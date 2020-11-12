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

const COMMENTS = './test/files/comments.idl';
const COMMENTS_CLEANED = './test/files/comments-cleaned.idl';

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
    it('Verifies that blank lines and comments are purged', () => {
      let buffer = fs.readFileSync(COMMENTS_CLEANED);
      const comparisonFile = buffer.toString();
      const options = { "clean": true }
      const cleanedFile = utils.getIDLFile(COMMENTS, options);
      assert.equal(cleanedFile, comparisonFile);
    });
  });
});