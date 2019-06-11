'use strict';

const { execSync } = require('child_process');
const { IDLFileSet } = require('./idlfileset.js');
const { InterfaceData } = require('./interfacedata.js');
const { initiateLogger } = require('./log.js');
const utils = require('./utils.js');
const winston = require('winston');

initiateLogger();

const CURRENT_TAG = '6f24c195641ec14b5752dda33a052fb45279c81e';
const PREVIOUS_TAG = 'cf8a81862c67e459cb122641c8d09e04f7b62ede';
const CURRENT_DIR = 'current/';
const PREVIOUS_DIR = 'previous/';

const CURRENT_URL = `https://chromium.googlesource.com/chromium/src/+archive/${CURRENT_TAG}/third_party/blink/renderer.tar.gz`;

const PREVIOUS_URL = `https://chromium.googlesource.com/chromium/src/+archive/${PREVIOUS_TAG}/third_party/blink/renderer.tar.gz`;

_startBurnLogFile();

// let result = _command(`./update-idl.sh ${CURRENT_URL} current/ noBCD`);
// console.log(result);
const idlFiles = new IDLFileSet(CURRENT_DIR);
const files = idlFiles.files;
for (let f of files) {
  try {
    let idlFile = new InterfaceData(f, {
      experimental: false,
      originTrial: false,
      flagPath: `${CURRENT_DIR}platform/runtime_enabled_features.json5`
    });
    let keys = idlFile.getkeys(true);
    for (let k in keys) {
      console.log(keys[k]);
    }
  } catch (e) {
    switch (e.constructor.name) {
      case 'IDLError':
      case 'WebIDLParseError':
        let msg = (f.path() + "\n\t" + e.message + "\n\n");
        global.__logger.info(msg);
        continue;
      default:
        throw e;
    }
  }
}


function _startBurnLogFile() {
  let fileName = `experiments-${utils.today()}.log`;

  const fileTransport = new winston.transports.File({
    filename: fileName
  });
  global.__logger.add(fileTransport);
}

function _command(command) {
  let buffer = execSync(command, {
    cwd: __dirname
  });
  return buffer.toString();
}

