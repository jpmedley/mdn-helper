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
const utils = require('./utils.js');

const IDL_ZIP_NANE = 'renderer.tar.gz';
const IDL_ZIP = `https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/${IDL_ZIP_NANE}`;
const IDL_DIR = `${__dirname}/idl/`

function _update(source = IDL_ZIP, destination = IDL_DIR) {
  utils.deleteUnemptyFolder(destination);
  _downloadBCD()
  _downloadIDL(source, destination)
  .then(() => {
    console.log('\nData update complete.\n');
  });
}

async function _downloadIDL(source, destination) {
  console.log('\nDownloading IDL and related data files from Chrome source code.\n');
  await download(source, destination, { filename: IDL_ZIP_NANE });
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
  // fs.unlinkSync(destination);
  
}

function _downloadBCD() {
  console.log('\nInstalling latest browser compatibility data.\n');
  shell.exec('npm install @mdn/browser-compat-data@latest')
  shell.exec('curl https://raw.githubusercontent.com/mdn/browser-compat-data/master/schemas/compat-data.schema.json > test/files/compat-data.schema.json');
}

module.exports.update = _update;