'use strict';

const config = require('config');
const fs = require('fs');

const QUESTIONS_FILE = _getConfig('questionsFile');
const TOKEN_RE = /\[\[(?:shared:)?([\w\-]+)\]\]/;
const TEMPLATES = 'templates/';
const OUT = config.get('Application.outputDirectory');
const COMMANDS = ['build', 'burn', 'clean', 'css', 'find', 'header', 'help', 'interface', 'test'];

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

function _getRealArguments(args) {
  args.shift();
  args.shift();
  let commands = ['build', 'burn', 'clean', 'css', 'find', 'header', 'help', 'interface', 'test'];
  if (!commands.includes(args[0])) {
    throw new Error("The command must be one of build, burn, clean, css, find, header, help, or interface.");
  }
  if (args[0] == 'find') { return args; }
  let newArgs = new Array();
  args.forEach((arg, index, args) => {
    arg = _normalizeArg(arg);
    switch (arg) {
      case '--constructor':
      case '--header':
      case '--interface':
        newArgs.push(arg);
        newArgs.push(args[2]);
        break;
      case '-it':
        const iterables = ['entries', 'forEach', 'keys', 'values'];
        iterables.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '-m':
      case '--method':
        if (args[index+1].endsWith('(')) { args[index+1] += ")"; }
        if (!args[index+1].endsWith('()')) { args[index+1] += "()"; }
        newArgs.push(arg);
        break;
      case '-mp':
        const maplike = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
        maplike.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '-mr':
        const readonlyMaplike = ['entries', 'forEach', 'get', 'has', 'keys', 'size', 'values'];
        readonlyMaplike.forEach((functionName) => {
          newArgs.push('-' + functionName);
          newArgs.push(functionName);
        });
        break;
      case '--overview':
        newArgs.push(arg)
        newArgs.push((args[0] + '_overview'));
        break;
      default:
        newArgs.push(arg);
    };
  });

  let realArgs = new Array();
  realArgs.push(newArgs[0]);
  const simples = ['burn','clean','help'];
  if (simples.includes(newArgs[0])) { return realArgs; }

  newArgs.shift();
  if (newArgs.length == 0) {
    throw new Error("This command requires flags.");
    _printHelp();
  }

  for (let i = 0; i < newArgs.length; i++) {
    if (newArgs[i].startsWith('--')) {
      newArgs[i] = newArgs[i].replace('--', '@@');
    }
    if (newArgs[i].startsWith('-')) {
      newArgs[i] = newArgs[i].replace('-', '@@');
    }
  }
  let argString = newArgs.join();
  // let realArgs = argString.split('@@');
  let argArray = argString.split('@@');
  if (argArray[0]=='') { argArray.shift(); }
  for (let arg in argArray) {
    if (argArray[arg].endsWith(',')) {
      argArray[arg] = argArray[arg].slice(0, argArray[arg].length -1);
    }
  }
  realArgs = realArgs.concat(argArray);
  return realArgs;
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

function _normalizeArg(arg) {
  let args = { "-c":"--constructor", "--constructor":"--constructor", "-d": "--directive", "--directive": "--directive", "-e":"--event", "--event":"--event", "-h":"--handler", "-H":"--header", "--handler":"--handler", "--header":"--header", "-i":"--interface", "--interface":"--interface", "-m":"--method", "--method":"--method", "-o":"--overview", "--overview":"--overview", "-p":"--property", "--property":"--property", "-s": "--css", "--css": "--css"}
  if (arg in args) {
    return args[arg];
  } else {
    return arg;
  }
}

function _printHelp() {
  let doc = 'Basic usage:\n' +
            '\tnpm run [command] [arguments]\n' +
            'Commands:\n' +
            '\tbuild _searchString_\n' +
            '\tburn\n' +
            '\tclean\n' +
            '\tcss -n _selectorName_\n' +
            '\tfind _searchString_\n' +
            '\theader -n _headerName_ [(-H | --header)] [(-d | --directive) _directiveName_]\n' +
            '\tinterface -n _interfaceName_ [-o] [-i] [-c] [-it] [-mp] [-mr]\n' +
            '\t\t[(-e | --event) _eventName_] [(-h | --handler) _handlerName_]\n' +
            '\t\t[(-m | --method) _methodName_] [(-p | --property) _propertyName_]\n' +
            '\thelp\n' +
            'See the README file for details.\n'


  console.log(doc);
  process.exit();
}

function _printWelcome() {
  console.clear();
  console.log("=".repeat(80));
  console.log(" ".repeat(30) + "Welcome to mdn-helper" + " ".repeat(29));
  console.log("=".repeat(80));
}

function _validateCommand(args) {
  if (!COMMANDS.includes(args[2])) {
    let list = COMMANDS.join(', ');
    let msg = `The command must be one of:\n\t${list}.\n`;
    throw new Error(msg);
  }
  return args[2];
}

module.exports.OUT = OUT;
module.exports.TOKEN_RE = TOKEN_RE;
module.exports.WIREFRAMES = WIREFRAMES;
module.exports.deleteUnemptyFolder = _deleteUnemptyFolder;
module.exports.getConfig = _getConfig;
module.exports.getIDLFile = _getIDLFile;
module.exports.getOutputFile = _getOutputFile;
module.exports.getTemplate = _getTemplate;
module.exports.getRealArguments = _getRealArguments;
module.exports.getWireframes = _getWireframes;
module.exports.printHelp = _printHelp;
module.exports.printWelcome = _printWelcome;
module.exports.validateCommand = _validateCommand;
