'use strict';

const config = require('config');

let interfaceName = "FontFace";
let directory = "out";

const CONCISE = Object.freeze({
  intro: '',
  landing: '',
  reference: '',
  constructor: '',
  method:'',
  property: ''
});

const VERBOSE = Object.freeze({
  intro: `\nTo document the ${interfaceName} interface, MDN requires a page for the interface, \
\nitself a page for its constructor, and pages for each of its members. To \
\ncreate these pages, you'll be asked a series of questions about the \
\n${interfaceName} interface. The questions will be divided into several groups:\n \
\n* First, you'll be asked questions whose answers are shared among all the \
\n  pages to be created. \
\n* Next, you'll be asked qeustions in groups corresponding to overview, \
\n  interface, constructor, and every member of the ${interfaceName} interface.\
\nIf a question has a default, it will be in parenthesis and in lighter text \
\nafter the question. Press return to accept the default.\n \
\n The answers will be combined with page templates to create drafts for MDN \
\n pages. Drafts are written to the ${directory}/ directory.\n\n`,
  landing: `\nA landing page provides basic information about the API and a list of interfaces \
\nin the API. For an example, go to \
\nhttps://developer.mozilla.org/en-US/docs/Web/API/Sensor_APIs\n`,
  reference: `\nA reference page, also called an interface page is an overview for a single \
  \ninterface and contains basic descriptions of every interface member. For an \
  \nexample go to https://developer.mozilla.org/en-US/docs/Web/API/OrientationSensor`,
  constructor: '',
  method:'',
  property: ''
});

const helpTypes = { CONCISE: CONCISE, VERBOSE: VERBOSE };

function _getHelp() {
  const helpType = config.get('Application.help');
  return helpTypes[helpType];
}

module.exports.help = _getHelp();
