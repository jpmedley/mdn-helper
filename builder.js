'use strict';

const actions = require('./actions');
const { BCDManager } = require('./bcdmanager.js');
const Enquirer = require('enquirer');
const fs = require('fs');
const { help } = require('./help/help.js');
const { InterfaceData } = require('./interfacedata.js');
const { Page } = require('./page.js');
const { Questions } = require('./questions.js');
const utils = require('./utils.js');

const FLAGS = {
  "-c":"--constructor",
  "--constructor":"--constructor",
  "-d": "--directive",
  "--directive": "--directive",
  "-e":"--event",
  "--event":"--event",
  "-h":"--handler",
  "-H":"--header",
  "--handler":"--handler",
  "--header":"--header",
  "-l":"--landing",
  "--landing":"--landing",
  "-m":"--method",
  "--method":"--method",
  "-p":"--property",
  "--property":"--property",
  "-r":"--reference",
  "--reference":"--reference",
  "-s": "--css",
  "--css": "--css"
}

function getNamedArg(arg) {
  if (arg in FLAGS) {
    return FLAGS[arg];
  } else {
    return arg;
  }
}


function pageExists(arg, pageData) {
  let args = arg.split(',');
  let page = pageData.find(aPage=>{
    return aPage.key.includes(args[1]);
  });
  if (page) { return page.mdn_exists; }
  return false;
}

class Builder {
  constructor(options) {

  }

  _normalizeArguments(args) {
    // Remove 'node index.js' from args.
    args.shift();
    args.shift();
    switch (args[0]) {
      case 'css':
        return this._normalizeCSSArgs(args);
        break;
      case 'header':
        if (!FLAGS[args[3]]) {
          throw new Error('This command requires more than one flag.');
        }
        return this._normalizeHeaderArgs(args);
        break;
      case 'interface':
        if (!FLAGS[args[3]]) {
          throw new Error('This command requires more than one flag.');
        }
        return this._normalizeInterfaceArgs(args);
        break;
    }
  }

  _normalizeCSSArgs(args) {
    let trueArgs = new Array();
    trueArgs.push(args[0]);
    trueArgs.push('n,' + args[2]);
    trueArgs.push('css,' + args[2]);
    return trueArgs;
  }

  _normalizeHeaderArgs(args) {
    let trueArgs = new Array();
    args.forEach((arg, index, args) => {
      arg = getNamedArg(arg);
      switch (arg) {
        case '--directive':
          trueArgs.push(arg);
          break;
        case '--header':
          trueArgs.push(arg);
          trueArgs.push(args[2]);
          break;
        default:
          trueArgs.push(arg);
      }
    });
    trueArgs = this._rearrangeArgs(trueArgs);
    return trueArgs;
  }

  _normalizeInterfaceArgs(args) {
    let trueArgs = new Array();
    args.forEach((arg, index, args) => {
      arg = getNamedArg(arg);
      switch (arg) {
        case '--constructor':
          // NEW
          trueArgs.push(arg);
          trueArgs.push(args[2] + '.' + args[2]);
          break;
        case '--header':
        case '--reference':
          trueArgs.push(arg);
          trueArgs.push(args[2]);
          break;
        case '-it':
          const iterables = ['entries', 'forEach', 'keys', 'values'];
          iterables.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '-m':
        case '--method':
          if (args[index+1].endsWith(')')) {
            args[index+1] = args[index+1].slice(0, -1);
          }
          if (args[index+1].endsWith('(')) {
            args[index+1] = args[index+1].slice(0, -1);
          }
          trueArgs.push(arg);
          break;
        case '-mp':
          const maplike = ['clear', 'delete', 'entries', 'forEach', 'get', 'has', 'keys', 'set', 'size', 'values'];
          maplike.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '-mr':
          const readonlyMaplike = ['entries', 'forEach', 'get', 'has', 'keys', 'size', 'values'];
          readonlyMaplike.forEach((functionName) => {
            trueArgs.push('-' + functionName);
            trueArgs.push(functionName);
          });
          break;
        case '--landing':
          trueArgs.push(arg)
          trueArgs.push(args[2]);
          break;
        default:
          trueArgs.push(arg);
      };
    });

    trueArgs = this._rearrangeArgs(trueArgs);
    return trueArgs;
  }

  _rearrangeArgs(args) {
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith('--')) {
        args[i] = args[i].replace('--', '@@');
      }
      if (args[i].startsWith('-')) {
        args[i] = args[i].replace('-', '@@');
      }
    }
    let argString = args.join();
    let arrangedArgs = argString.split('@@');
    if (arrangedArgs[0]=='') { arrangedArgs.shift(); }
    for (let arg in arrangedArgs) {
      if (arrangedArgs[arg].endsWith(',')) {
        arrangedArgs[arg] = arrangedArgs[arg].slice(0, arrangedArgs[arg].length -1);
      }
    }
    return arrangedArgs;
  }
}

class _CLIBuilder extends Builder {
  constructor(options) {
    super(options);
    this._args = options.args;
  }

  _initPages() {
    let args = this._normalizeArguments(this._args);
    let parentType = args[0];
    let parentName = args[1].split(',')[1];

    // Add space for interface or header name to sharedQuestions,
    //  and remove it from args.
    let introMessage = `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\nYou will now be asked questions for answers that are shared\namong all the files to be created.\n`;
    let sharedQuestions = new Questions(introMessage);
    sharedQuestions[parentType] = parentName;
    sharedQuestions['name'] = parentName;
    sharedQuestions.add(parentType, parentName);

    // We no longer need the conent type and name.
    args.shift();
    args.shift();

    // Process remaining arguments.
    this._pages = new Array();
    args.forEach((arg, index, args) => {
      let members = arg.split(',');
      let aPage = new Page(members[1], members[0], sharedQuestions);
      this._pages.push(aPage);
    });
  }

  async build() {
    this._initPages();
    for (let p of this._pages) {
      await p.askQuestions();
      p.write();
    }
  }
}

class _IDLBuilder extends Builder {
  constructor(options) {
    super(options);
    this._interfaceData = options.interfaceData;
    this._jsonOnly = options.jsonOnly || false;
    this._interactive = options.interactive || false;
  }

  async _initPages() {
    // Add space for interface or header name to sharedQuestions.
    const introMessage = help.intro + (`-`.repeat(80)) + `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\n` + help.shared;
    const sharedQuestions = new Questions(introMessage);
    sharedQuestions['interface'] = this._interfaceData.name;
    sharedQuestions['name'] = this._interfaceData.name;
    sharedQuestions.add('interface', this._interfaceData.name);

    // Process remaining arguments.
    this._pages = new Array();
    let skippingPages = new Array();
    const missingPages = await this._interfaceData.ping();
    missingPages.forEach((page, index, pages) => {
      if (page.mdn_exists) {
        skippingPages.push([page.type, page.key]);
      } else {
        const newPage = new Page(page.key, page.type, sharedQuestions);
        this._pages.push(newPage);
      }
    });
    if (skippingPages.length > 0) {
      let msg = '\nThe following pages from this interface already exist. You will not be asked\nquestions about them.\n';
      for (let s of skippingPages) {
        msg += `\t ${s[1]} ${s[0]}\n`;
      }
      console.log(msg);
      await utils.pause();
    }
    if (missingPages === 0) {
      let msg = 'No MDN pages have been created for this interface.';
      console.log(msg);
    }
  }

  _writeBCD() {
    let name = this._interfaceData.name;
    // const bcd = new BCD();
    if (global._bcd.api[name]) {
      const msg = `\nA BCD file already exists for ${name}. You will need to manually\nverify it for completeness.\n`;
      console.log(msg);
      return;
    }
    let bcdm = new BCDManager();
    let outPath = utils.OUT + name + '/';
    if (!fs.existsSync(outPath)) { fs.mkdirSync(outPath); }
    let outFilePath = outPath + name + '.json';
    bcdm.getBCD(this._interfaceData, outFilePath);
  }

  async build() {
    this._writeBCD();
    if (this._jsonOnly) { return; }
    await this._initPages();
    let msg;
    if (this._pages.length === 0) {
      msg = '\nThere are no undocumented members for this interface.\n';
      console.log(msg);
      return;
    }
    for (let p of this._pages) {
      if (this._interactive) {
        await p.askQuestions();
      }
      p.write();
    }
    msg = `\nMDN drafts were written to ${utils.OUT}${this._interfaceData.name}.`
    console.log(msg);
  }

}

module.exports.pageExists = pageExists;
module.exports.CLIBuilder = _CLIBuilder;
module.exports.IDLBuilder = _IDLBuilder;
