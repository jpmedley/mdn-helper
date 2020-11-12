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
const shell = require('shelljs');

let EXCLUSIONS = config.get('Application.deprecated');
EXCLUSIONS.push(...config.get('Application.muted'));
const USE_EXCLUSIONS = config.get('Application.useExclusions');
const QUESTIONS_FILE = _getConfig('questionsFile');
const TEMPLATES = 'templates/';
// const HOMEDIR = require('os').homedir();
const APP_ROOT = path.resolve(__dirname);
const UPDATE_INTERVALS = ['hourly','daily','weekly'];
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;
const ONE_WEEK = 604800000;

const KEY_FILE_PATH = 'config/alternate-keys.json';

const BLANK_LINE_RE = /^\s*$(\r\n|\r|\n)/gm;
const COMMENT_START_RE = /^\/\*$(\r\n|\r|\n)/gm;
const COMMENT_MULTILINE_RE = /^\s\*.*$(\r\n|\r|\n)/gm;
const COMMENT_SINGLELINE_RE = /\/\/.*$(\r\n|\r|\n)/gm;

let OUT = config.get('Application.outputDirectory');
// if (OUT.includes('$HOME')) {
//   OUT = OUT.replace('$HOME', HOMEDIR);
// }
// if (!fs.existsSync(OUT)) { fs.mkdirSync(OUT); }

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
    fileContents = fileContents.replace(COMMENT_START_RE, "");
    fileContents = fileContents.replace(COMMENT_MULTILINE_RE, "");
    fileContents = fileContents.replace(COMMENT_SINGLELINE_RE, "");
    fileContents = fileContents.replace(BLANK_LINE_RE, "");
  }
  return fileContents;
}

function _getFile(path) {
  const buffer = fs.readFileSync(path);
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
  const folderToMake = _resolveHome(`${OUT}${dirName}/`);
  return _makeFolder(folderToMake);
}

function _makeFolder(dirName) {
  dirName = _resolveHome(dirName);
  if (fs.existsSync(dirName)) { return dirName; }
  fs.mkdirSync(dirName);
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

  today = dd + '-' + mm + '-' + yyyy;
  return today;
}

function _update(args) {
  let force = false;
  if (args) {
    force = args.some(e => {
      return (e.includes('-f'));
    });
  }
  const updateFile = APP_ROOT + '/.update';
  const now = new Date();
  const lastUpdate = (() => {
    let lu;
    if (fs.existsSync(updateFile)) {
      lu = fs.readFileSync(updateFile);
      lu = lu.toString();
    } else {
      lu = "Tue Jan 22 1019 15:36:25 GMT-0500 (Eastern Standard Time)";
    }
    return new Date(lu);
  })();
  const actualInterval = now - lastUpdate
  const updateInterval = config.get('Application.update');
  let update = false;
  switch (updateInterval) {
    case 'hourly':
      if (actualInterval > ONE_HOUR) { update = true; }
      break;
    case 'daily':
      if (actualInterval > ONE_DAY) { update = true; }
      break;
    case 'weekly':
      if (actualInterval > (ONE_WEEK)) { update = true; }
      break;
  }
  if (force) { update = force; }
  if (update || force){
    shell.exec('./update-idl.sh');
    fs.writeFileSync(updateFile, now);
    return true;
  } else if (!update || force) {
    return false;
  }
}

module.exports.OUT = OUT;
module.exports.WIREFRAMES = WIREFRAMES;
module.exports.confirm = _confirm;
module.exports.deleteUnemptyFolder = _deleteUnemptyFolder;
module.exports.displayConfig = _displayConfig;
module.exports.getAlternateKey = _getAlternateKey;
module.exports.getBCDPath = _getBCDPath
module.exports.getConfig = _getConfig;
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
module.exports.today = _today;
module.exports.update = _update;
