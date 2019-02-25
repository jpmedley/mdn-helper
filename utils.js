'use strict';

const config = require('config');
const fs = require('fs');
const path = require('path');
const shell = require('shelljs');


const QUESTIONS_FILE = _getConfig('questionsFile');
const TOKEN_RE = /\[\[(?:shared:)?([\w\-]+)\]\]/;
const TEMPLATES = 'templates/';
const HOMEDIR = require('os').homedir();
let OUT = config.get('Application.outputDirectory');
const REQUIRES_FLAGS = ['css','header','interface'];
const COMMANDS = ['build','burn','clean','config','find','help'].concat(REQUIRES_FLAGS).sort();
const APP_ROOT = path.resolve(__dirname);
const UPDATE_INTERVALS = ['daily','weekly'];
const ONE_DAY = 86400000;

if (OUT.includes('$HOME')) {
  OUT = OUT.replace('$HOME', HOMEDIR);
} 
if (!fs.existsSync(OUT)) { fs.mkdirSync(OUT); }

function loadWireFrames() {
  const wireframePath = TEMPLATES + QUESTIONS_FILE;
  const wireframeBuffer = fs.readFileSync(wireframePath);
  const wireframes =  JSON.parse(wireframeBuffer.toString()).templates;
  return wireframes;
}

const WIREFRAMES = loadWireFrames();

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

function _getIDLFile(name) {
  if (!name.endsWith(".idl")) { name += ".idl"; }
  // let filePath = IDL_FILES + name;
  let filePath = name;
  let buffer = fs.readFileSync(filePath);
  return buffer.toString();
}

function _getTemplate(name) {
  if (!name.endsWith(".html")) { name += ".html"; }
  let templatePath = TEMPLATES + name;
  let buffer = fs.readFileSync(templatePath);
  return buffer.toString();
}

function _getWireframes() {
  const wireframePath = TEMPLATES + QUESTIONS_FILE
  const wireframeBuffer = fs.readFileSync(wireframePath);
  const wireframes =  JSON.parse(wireframeBuffer.toString()).templates;
  return wireframes;
}

function _makeOutputFolder(dirName) {
  const out = _getConfig('outputDirectory');
  const todayFolder = `${out}${dirName}/`;
  if (fs.existsSync(todayFolder)) { return todayFolder; }
  fs.mkdirSync(todayFolder);
  return todayFolder;
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

function _update(force=false) {
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
    case 'daily':
      if (actualInterval > ONE_DAY) { update = true; }
      break;
    case 'weekly':
      if (actualInterval > (7 * ONE_DAY)) { update = true; }
      break;
  }
  if (update){
    shell.exec('./update-idl.sh');
    fs.writeFileSync(updateFile, now);
  }
}

function _validateCommand(args) {
  if (['burn','clean','config','help'].includes(args[2])) { return args[2]; }
  if (args.length < 4) {
    throw new Error('This command requires arguments.');
  }
  if (!COMMANDS.includes(args[2])) {
    let list = COMMANDS.join(', ');
    let msg = `The command must be one of:\n\t${list}.\n`;
    throw new Error(msg);
  }
  if (REQUIRES_FLAGS.includes(args[2])) {
    if (args[3] != '-n') {
      throw new Error('This command requires flags.');
    }
  }
  return args[2];
}

module.exports.OUT = OUT;
module.exports.TOKEN_RE = TOKEN_RE;
module.exports.WIREFRAMES = WIREFRAMES;
module.exports.deleteUnemptyFolder = _deleteUnemptyFolder;
module.exports.displayConfig = _displayConfig;
module.exports.getConfig = _getConfig;
module.exports.getIDLFile = _getIDLFile;
module.exports.getOutputFile = _getOutputFile;
module.exports.getTemplate = _getTemplate;
module.exports.getWireframes = _getWireframes;
module.exports.makeOutputFolder = _makeOutputFolder;
module.exports.printHelp = _printHelp;
module.exports.printWelcome = _printWelcome;
module.exports.today = _today;
module.exports.update = _update;
module.exports.validateCommand = _validateCommand;
