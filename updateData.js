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

const fs = require('fs');
const Path = require('path');
const shell = require('shelljs');
const tar = require('tar');
const config = require('config');
const utils = require('./utils.js');

const DEFAULT_UPDATE = "Tue Jan 22 1019 15:36:25 GMT-0500 (Eastern Standard Time)";
const IDL_ZIP_NANE = 'renderer.tar.gz';

const IDL_ZIP = `https://chromium.googlesource.com/chromium/src/+archive/refs/heads/main/third_party/blink/${IDL_ZIP_NANE}`;
const IDL_DIR = `${__dirname}/idl/`;
const ONE_HOUR = 3600000;
const ONE_DAY = 86400000;
const ONE_WEEK = 604800000;
const UPDATE_FILE = `${__dirname}/.update`;

function downloadPopularities() {
  console.log('\nDownloading latest popularities.json.\n');
  shell.exec('curl https://raw.githubusercontent.com/mdn/content/main/files/popularities.json > popularities.json');
}

function isUpdateNeeded() {
  const now = new Date();
  const lastUpdate = _getLastUpdate();
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
      if (actualInterval > (ONE_WEEK)) { updateNow = true; }
      break;
  }
  return updateNow;
}

function showVersions() {
  const idlDate = _getLastUpdate();
  let msg;
  if (idlDate !== DEFAULT_UPDATE) {
    msg = `\nIDL updated on:`;
    msg += `\n\t${idlDate}`;
  } else {
    msg = `\nThere's no record of a recent IDL update. Please run:`;
    msg += `\n\tnpm run updatedata`;
  }
  utils.sendUserOutput(msg);

  const packageJson = utils.getFile('package.json');
  const fileLines = packageJson.split('\n');
  const bcdLine = fileLines.find((l) => {
    return l.includes("@mdn/browser-compat-data");
  });
  if (bcdLine) {
    msg = `\nBrowser Compatibility Data version:`;
    msg += `\n${bcdLine}`;
  } else {
    msg = `BCD version number not found.`
  }
  utils.sendUserOutput(msg);
  utils.sendUserOutput(' ');
}

function update(args, source = IDL_ZIP, destination = IDL_DIR) {
  if (isUpdateNeeded()) {
    return updateNow(args, source, destination);
  } else {
    return false;
  }
}

function updateForAdmin(args, source = IDL_ZIP, destination = IDL_DIR) {
  updateNow(args, source, destination);
  downloadPopularities();
}

function updateNow(args, source = IDL_ZIP, destination = IDL_DIR) {
  utils.deleteUnemptyFolder(destination);
  _downloadBCD();
  _downloadIDL(source, destination)
  .then(() => {
    fs.writeFileSync(UPDATE_FILE, (new Date().toString()));
    console.log('Data update complete.\n');
  });
  console.log("-".repeat(80));
  showVersions();
  return true;
}

function _downloadBCD() {
  console.log('\nInstalling latest browser compatibility data.\n');
  shell.exec('npm install @mdn/browser-compat-data@latest');
  const bcdDownload = `curl https://raw.githubusercontent.com/mdn/browser-compat-data/main/schemas/compat-data.schema.json > ${__dirname}/test/files/compat-data.schema.json`;
  shell.exec(bcdDownload);
}

async function _downloadIDL(source, destination) {
  console.log('\nDownloading IDL and related data files from Chrome source code.\n');
  utils.makeFolder(IDL_DIR);
  shell.exec(`curl ${source} > ${destination}${IDL_ZIP_NANE}`);
  var filter = (path, entry) => {
    if (path.includes('bindings/')) { return false; }
    if (path.includes('build/')) { return false; }
    if (path.includes('extensions/')) { return false; }
    if (path.includes('platform/fonts/')) { return false; }
    if (path.includes('platform/loader/')) { return false; }
    if (path.includes('platform/network/')) { return false; }
    if (path.includes('.idl')) { return true; }
    if (path.includes('.json5')) { return true; }
    return false;
  }
  var warn = (code, message, data) => {
    console.log(message);
  }
  tar.x({
    cwd: IDL_DIR,
    file: `${IDL_DIR}${IDL_ZIP_NANE}`,
    filter: filter,
    sync: true,
    warn: warn
  });
  utils.deleteFile(`${destination}${IDL_ZIP_NANE}`);
}

function _getLastUpdate() {
  let lu;
  if (fs.existsSync(UPDATE_FILE)) {
    lu = fs.readFileSync(UPDATE_FILE).toString();
  } else {
    lu = DEFAULT_UPDATE;
  }
  return new Date(lu);
}

module.exports.downloadPopularities = downloadPopularities;
module.exports.isUpdateNeeded = isUpdateNeeded;
module.exports.showVersions = showVersions;
module.exports.update = update;
module.exports.updateForAdmin = updateForAdmin;
module.exports.updateNow = updateNow;