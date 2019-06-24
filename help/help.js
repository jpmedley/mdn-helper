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

const config = require('config');

const CONCISE = Object.freeze({
  intro: '\n',
  shared: '\n',
  landing: '\n',
  reference: '\n',
  constructor: '\n',
  method:'\n',
  property: '\n'
});

const VERBOSE = Object.freeze({
  intro: `\nTo document the selected interface, MDN requires a page for the interface, \
\nitself a page for its constructor, and pages for each of its members. To \
\ncreate these pages, you'll be asked a series of questions about the \
\nselected interface. The questions will be divided into several groups:\n \
\n* First, you'll be asked questions whose answers are shared among all the \
\n  pages to be created. \
\n* Next, you'll be asked qeustions in groups corresponding to overview, \
\n  interface, constructor, and every member of the selected interface.\
\nIf a question has a default, it will be in parenthesis and in lighter text \
\nafter the question. Default values may contain HTML tags or kumascript \
\ntokens. Press return to accept the default.\n \
\n The answers will be combined with page templates to create drafts for MDN \
\n pages. Drafts are written to the configured output directory.\n\n`,
  shared: 'You will now be asked questions for answers that are shared among all the files\nto be created.\n\n',
  landing: `\nA landing page provides basic information about the API and a list of interfaces \
\nin the API. For an example, go to \
\nhttps://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs\n\n`,
  reference: `\nA reference page, also called an interface page is an overview for a single \
  \ninterface and contains basic descriptions of every interface member. For an \
  \nexample go to https://developer.mozilla.org/en-US/docs/Web/API/OrientationSensor\n\n`,
  constructor: '\n',
  method:'\n',
  property: '\n'
});

const helpTypes = { CONCISE: CONCISE, VERBOSE: VERBOSE };

function _getHelp() {
  const helpType = config.get('Application.help');
  return helpTypes[helpType];
}

module.exports.help = _getHelp();
