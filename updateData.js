// Copyright 2020 Google LLC
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

'use-strict';

const download = require('download');
const fs = require('fs');
const Path = require('path');
const shell = require('shelljs');
const tar = require('tar');
const config = require('config');
const utils = require('./utils.js');

const IDL_ZIP_NANE = 'renderer.tar.gz';
const IDL_ZIP = `https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/${IDL_ZIP_NANE}`;
const IDL_DIR = `${__dirname}/idl/`;
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;
const ONE_WEEK = 604800000;
const ONE_MONTH = ONE_DAY * 30;
const UPDATE_FILE = `${__dirname}/.update`;

function _update(args, source = IDL_ZIP, destination = IDL_DIR) {
  const force = _isForced(args);
  const update = _isUpdateNeeded();
  if (update || force) {
    utils.deleteUnemptyFolder(destination);
    _downloadBCD()
    _downloadIDL(source, destination)
    .then(() => {
      fs.writeFileSync(UPDATE_FILE, (new Date().toString()));
      console.log('Data update complete.\n');
    });
    return true;
  } else {
    return false;
  }

}

function _isUpdateNeeded() {
  const now = new Date();
  const lastUpdate = (() => {
    let lu;
    if (fs.existsSync(UPDATE_FILE)) {
      lu = fs.readFileSync(UPDATE_FILE).toString();
    } else {
      lu = "Tue Jan 22 1019 15:36:25 GMT-0500 (Eastern Standard Time)";
    }
    return new Date(lu);
  })();
  const actualInterval = now - lastUpdate;
  const updateInterval = config.get('Application.update');
  let updateNow = false;
  switch (updateInterval) {
    case 'hourly':
      if (actualInterval > ONE_HOUR) { updateNow = true; }
      break;
    case 'daily':
      if (actualInterval > ONE_DAY) { updateNow = true; }
      break;
    case 'weekly':
      if (actualInterval > ONE_WEEK) { updateNow = true; }
      break;
    case 'monthly':
      if (actualInterval > ONE_MONTH) { updateNow = true; }
  }
  return updateNow;
}

function _isForced(args) {
  let force = false;
  if (args) {
    force = args.some(e => {
      return (e.includes('-f'));
    });
  }
  return force;
}

async function _downloadIDL(source, destination) {
  console.log('\nDownloading IDL and related data files from Chrome source code.\n');
  utils.makeFolder('idl');
  shell.exec(`curl ${source} > ${destination}${IDL_ZIP_NANE}`);
  var filter = (path, entry) => {
    if (path.includes('bindings/')) { return false }
    if (path.includes('build/')) { return false }
    if (path.includes('platform/fonts/')) { return false }
    if (path.includes('platform/loader/')) { return false }
    if (path.includes('platform/network/')) { return false }
    if (path.includes('.idl')) { return true; }
    if (path.includes('.json5')) { return true; }
    return false;
  }
  var warn = (code, message, data) => {
    console.log(message);
  }
  tar.x({
    cwd: './idl',
    file: `./idl/${IDL_ZIP_NANE}`,
    filter: filter,
    sync: true,
    warn: warn
  });
  utils.deleteFile(`${destination}${IDL_ZIP_NANE}`);
}

function _downloadBCD() {
  console.log('\nInstalling latest browser compatibility data.\n');
  shell.exec('npm install @mdn/browser-compat-data@latest')
  shell.exec('curl https://raw.githubusercontent.com/mdn/browser-compat-data/master/schemas/compat-data.schema.json > test/files/compat-data.schema.json');
}

module.exports.isUpdateNeeded = _isUpdateNeeded;
module.exports.update = _update;