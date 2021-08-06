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
const { Confirm, Input } = require('enquirer');
const fs = require('fs');
const { homedir } = require('os');
const JSON5 = require('json5');
const path = require('path');

let EXCLUSIONS = config.get('Application.deprecated');
EXCLUSIONS.push(...config.get('Application.muted'));
const USE_EXCLUSIONS = config.get('Application.useExclusions');
const QUESTIONS_FILE = _getConfig('questionsFile');
const TEMPLATES = `${__dirname}/templates/`;
const APP_ROOT = path.resolve(__dirname);

const KEY_FILE_PATH = 'config/alternate-keys.json';

const BLANK_LINE_RE = /^\s*$(\r\n|\r|\n)/gm;
const COMMENT_MULTILINE_RE = /^\s*\/\*([\s\S](?!\*\/))*\s?\*\//gm;
const COMMENT_SINGLELINE_RE = /\/\/.*$(\r\n|\r|\n)/gm;
const URL_RE = /https:\/\/(.(?!\*))*/g;

let OUT = config.get('Application.outputDirectory');
OUT = _resolveHome(OUT);

let AlternateKeys;

function loadWireFrames() {
  const wireframePath = TEMPLATES + QUESTIONS_FILE;
  const wireframeBuffer = fs.readFileSync(wireframePath);
  const wireframes =  JSON.parse(wireframeBuffer.toString()).templates;
  return wireframes;
}

const WIREFRAMES = loadWireFrames();

async function _confirm(msg, initial = "true") {
  const prompt = new Confirm({
    name: 'confirm',
    message: msg,
    initial: initial,
    format: (v) => {
      return v ? 'yes' : 'no';
    }
  });
  return await prompt.run();
}

function _deleteFile(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function _deleteUnemptyFolder(folder) {
  if (fs.existsSync(folder)) {
    fs.readdirSync(folder).forEach(file => {
      let path = folder + '/' + file;
      if (fs.statSync(path).isDirectory()) {
        _deleteUnemptyFolder(path);
      } else {
        fs.unlinkSync(path);
      }
    });
    fs.rmdirSync(folder);
  }
}

function _displayConfig() {
  let app = config.Application;
  console.log('Application configuration values');
  for (let a in app) {
    console.log('\t' + a + '=' + app[a]);
  }
  let user = config.User;
  let out = '';
  for (let u in user) {
    out += ('\t' + u + '=' + user[u] + '\n');
  }
  if (out) {
    console.log('User configuration values');
    console.log(out);
  }
  console.log('');
}

function _getAlternateKey(key) {
  if (!AlternateKeys) {
    AlternateKeys = _getJSON(KEY_FILE_PATH);
  }
  return AlternateKeys.alternateKeys[key];
}

function _getBCDPath() {
  let bcdPath = config.get('Application.bcdCommitDirectory');
  return _resolveHome(bcdPath);
}

function _getConfig(parameter) {
  if (config.has('User.' + parameter)) {
    return config.get('User.' + parameter);
  }
  return config.get('Application.' + parameter);
}
function _getConfigs(parameter) {
  let returns = {};
  if (config.has(`User.${parameter}`)) {
    returns.user = config.get(`User.${parameter}`);
    returns.user = _terminatePath(returns.user);
    returns.user = _resolveHome(returns.user);
  }
  if (config.has(`Application.${parameter}`)) {
    returns.app = config.get(`Application.${parameter}`);
    returns.app = _terminatePath(returns.app);
    returns.app = _resolveHome(returns.app);
  }
  return returns;
}

function _getOutputFile(filePath, reuse = false) {
  if (!reuse) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
  return fs.openSync(filePath, 'w');
}

function _getIDLFile(filePath, options = { "clean": false }) {

  if (!filePath.endsWith(".idl")) { filePath += ".idl"; }
  const buffer = fs.readFileSync(filePath);
  let fileContents = buffer.toString();
  if (options.clean) {
    // Remove if no regressions appear because of its absence.
    // fileContents = fileContents.replace(COMMENT_START_RE, "");
    // URLs can cause false positives when removing comments
    fileContents = fileContents.replace(URL_RE, "");
    fileContents = fileContents.replace(COMMENT_MULTILINE_RE, "");
    fileContents = fileContents.replace(COMMENT_SINGLELINE_RE, "");
    fileContents = fileContents.replace(BLANK_LINE_RE, "");
    fileContents = fileContents.replaceAll("[EnforceRange]", "");
    fileContents = fileContents.replaceAll("[TreatNullAs=EmptyString] ", "");
  }
  return fileContents;
}

function _getFile(filePath) {
  filePath = path.join(__dirname, filePath);
  const buffer = fs.readFileSync(filePath);
  return buffer.toString();
}

function _getJSON(path) {
  let fileContents = _getFile(path);
  let parser;
  if (path.endsWith(".json")) {
    parser = JSON;
  } else if (path.endsWith(".json5")) {
    parser = JSON5;
  } else {
    const msg = `The requested file does not have a 'json' or 'json5' extension: ${path}.`;
    throw new TypeError(msg);
  }
  return parser.parse(fileContents);
}

function _getTemplate(name) {
  if (!name.endsWith(".html")) { name += ".html"; }
  let templatePath = TEMPLATES + name;
  let buffer = fs.readFileSync(templatePath);
  return buffer.toString();
}

function _isExcluded(apiName) {
  if (USE_EXCLUSIONS) {
    return EXCLUSIONS.includes(apiName);
  }
  return false;
}

function _getWireframes() {
  const json = this._getJSON(TEMPLATES + QUESTIONS_FILE);
  return json.templates;
}

function _makeOutputFolder(dirName) {
  _makeFolder(OUT);
  const folderToMake = _resolveHome(`${OUT}${dirName}/`);
  return _makeFolder(folderToMake);
}

function _makeFolder(dirName) {
  dirName = _resolveHome(dirName);
  if (fs.existsSync(dirName)) { return dirName; }
  fs.mkdirSync(dirName, { recursive: true });
  return dirName;
}

async function _pause() {
  const prompt = new Input({
    message: 'Press Enter to continue.'
  });
  let ans = await prompt.run();
}

function _printHelp() {
  let intro = 'Basic usage:\n' +
            '\tnpm run <command> [<arguments>] -- [<flags>]\n\n' +
            'Commands:';
  console.log(intro);
  let help = fs.readFileSync(global.__basedir + '/help/HELP.txt');
  help = help.toString();
  console.log(help);
}

function _printWelcome() {
  console.clear();
  console.log("=".repeat(80));
  console.log(" ".repeat(30) + "Welcome to mdn-helper" + " ".repeat(29));
  console.log("=".repeat(80));
}

function _resolveHome(path) {
  return path.replace('$HOME',homedir());
}

function _terminatePath(path) {
  if (path.endsWith('/')) { return path; }
  return `${path}/`;
}

function _today() {
  let today = new Date();
  let dd = today.getDate();
  let mm = today.getMonth()+1; //January is 0!
  let yyyy = today.getFullYear();

  if(dd<10) {
      dd = '0'+dd
  }

  if(mm<10) {
      mm = '0'+mm
  }

  today = `${yyyy}-${mm}-${dd}`;
  return today;
}

module.exports.APP_ROOT = APP_ROOT;
module.exports.OUT = OUT;
module.exports.WIREFRAMES = WIREFRAMES;
module.exports.confirm = _confirm;
module.exports.deleteFile = _deleteFile
module.exports.deleteUnemptyFolder = _deleteUnemptyFolder;
module.exports.displayConfig = _displayConfig;
module.exports.getAlternateKey = _getAlternateKey;
module.exports.getBCDPath = _getBCDPath
module.exports.getConfig = _getConfig;
module.exports.getConfigs = _getConfigs;
module.exports.getFile = _getFile;
module.exports.getIDLFile = _getIDLFile;
module.exports.getJSON = _getJSON;
module.exports.getOutputFile = _getOutputFile;
module.exports.getTemplate = _getTemplate;
module.exports.getWireframes = _getWireframes;
module.exports.isExcluded = _isExcluded;
module.exports.makeFolder = _makeFolder;
module.exports.makeOutputFolder = _makeOutputFolder;
module.exports.pause = _pause;
module.exports.printHelp = _printHelp;
module.exports.printWelcome = _printWelcome;
module.exports.resolveHome = _resolveHome;
module.exports.terminatePath = _terminatePath;
module.exports.today = _today;
