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

const utils = require('../utils.js');
const page = require('../page.js');

async function _run(currentPage, question) {
  const answer = question.answer;
  // We can assume answer has a '#' because it was
  //   validated before this was called.
  if (answer.startsWith('#')) { return; }
  let pieces = answer.split('#');
  question.answer = '#' + pieces[1];
  console.log(question.answer);
}

module.exports.run = _run;
