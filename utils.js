'use strict';

const config = require('config');
const fs = require('fs');
const readline = require('readline');

const QUESTIONS_FILE = _getConfig('questionsFile');
const TOKEN_RE = /\[\[(?:shared:)?([\w\-]+)\]\]/;
const TEMPLATES = 'templates/';
const OUT = config.get('Application.outputDirectory');
if (!fs.existsSync(OUT)) { fs.mkdirSync(OUT); }

const _prompt = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function _closePrompt() {
  _prompt.close();
}

function _cleanOutput() {
  return new Promise((resolve, reject) => {
    let question = "Are you sure? Y or N";
    _prompt.question(question, (answer) => {
      if (answer === 'Y') {
        console.log("Cleaning");
        fs.readdir(OUT, (e, files) => {
          files.forEach(file => {
            fs.unlinkSync(OUT + file);
          })
        })
      }
      resolve();
    });
  });
}

function _getConfig(parameter) {
  if (config.has('User.' + parameter)) {
    return config.get('User.' + parameter);
  }
  return config.get('Application.' + parameter);
}

function _getTemplate(name) {
  if (!name.endsWith(".html")) { name += ".html"; }
  let templatePath = TEMPLATES + name;
  let buffer = fs.readFileSync(templatePath);
  return buffer.toString();
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
  let commands = ['clean', 'css', 'find', 'header', 'help', 'interface', 'test'];
  if (!commands.includes(args[0])) {
    throw new Error("The command must be one of clean, css, find, header, help, or interface.");
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
  if (newArgs[0] in ['clean','help']) { return realArgs; }

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
  let doc = '';
  doc += 'Basic usage:\n';
  doc += '\tnode index.js [command] [arguments]\n';
  doc += `Commands:\n`;
  doc += '\tclean\n';
  doc += '\tcss -n _selectorName_\n';
  doc += '\theader -n _headerName_ [(-H | --header)] [(-d | --directive) _directiveName_]\n';
  doc += '\tinterface -n _interfaceName_ [-o] [-i] [-c] [-it] [-mp] [-mr]\n';
  doc += '\t\t[(-e | --event) _eventName_] [(-h | --handler) _handlerName_]\n';
  doc += '\t\t[(-m | --method) _methodName_] [(-p | --property) _propertyName_]\n';
  doc += '\thelp\n';
  doc += 'See the README file for details.\n'

  console.log(doc);
  process.exit();
}

function _printWelcome() {
  console.clear();
  console.log("=".repeat(80));
  console.log(" ".repeat(30) + "Welcome to mdn-helper" + " ".repeat(29));
  console.log("=".repeat(80));
}

module.exports.OUT = OUT;
module.exports.TOKEN_RE = TOKEN_RE;
module.exports.cleanOutput = _cleanOutput;
module.exports.closePrompt = _closePrompt;
module.exports.getConfig = _getConfig;
module.exports.getIDLFile = _getIDLFile;
module.exports.getTemplate = _getTemplate;
module.exports.getRealArguments = _getRealArguments;
module.exports.getWireframes = _getWireframes;
module.exports.printHelp = _printHelp;
module.exports.printWelcome = _printWelcome;
module.exports.prompt = _prompt;
