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

const { bcd } = require('./bcd.js');
const { BCDBuilder } = require('./bcdbuilder.js');
const { help } = require('./help/help.js');
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
  "-r":"--interface",
  "--reference":"--interface",
  "-s": "--css",
  "--css": "--css"
}

// const NOT_NEEDED = [ "deleter", "getter", "iterable", "setter", "stringifier" ];

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
    // Remove 'node _command.js_' from args.
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
        case '--interface':
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
    this._writeOnly = options.args.some(arg => {
      return (arg.includes('-w') || arg.includes('--writefiles'))
    });
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

    // Create an array for the question objects.
    this._pages = new Array();

    // Process remaining arguments.
    args.forEach((arg, index, args) => {
      if ((arg.trim() === 'w') || arg.trim() === 'writeOnly') { return; }
      let members = arg.split(',');
      let aPage = new Page(members[1], members[0], sharedQuestions);
      this._pages.push(aPage);
    });
  }

  async build() {
    this._initPages();
    for (let p of this._pages) {
      if (!this._writeOnly) {
        await p.askQuestions();
      }
      p.write();
    }
  }
}

class _CSSBuilder extends Builder {
  constructor(options = { verbose: true }) {
    super(options);
  }
}

class _IDLBuilder extends Builder {
  constructor(options = { verbose: true }) {
    super(options);
    this._interactive = options.interactive || false;
    this._interfaceData = options.interfaceData;
    this._jsonOnly = options.jsonOnly || false;
    this._landingPageOnly = options.landingPageOnly || false;
    this._mode = options.mode || 'standard';
    this._verbose = options.verbose;
    if (!options.outPath) {
      this._outPath = utils.getOutputDirectory();
    } else {
      this._outPath = options.outPath;
    }
  }

  async _initPages() {
    // Add space for interface or header name to sharedQuestions.
    const introMessage = help.intro + (`-`.repeat(80)) + `\nSHARED QUESTIONS\n` + (`-`.repeat(80)) + `\n` + help.shared;
    const sharedQuestions = new Questions(introMessage);
    sharedQuestions['interface'] = this._interfaceData.name;
    sharedQuestions['name'] = this._interfaceData.name;
    sharedQuestions.add('interface', this._interfaceData.name);
    if (this._interfaceData.getSecureContext()) {
      sharedQuestions.add('isSecureContext', '{{securecontext_header}}');
    } else {
      sharedQuestions.add('isSecureContext', '');
    }

    // Create an array for the question objects.
    this._pages = new Array();

    // Add an object for the landing page.
    if (this._mode === 'standard') {
      let aPage = new Page('landing', 'landing', sharedQuestions);
      this._pages.push(aPage);
      if (this._landingPageOnly) { return; }
    }

    // Process remaining arguments.
    // this._pages = new Array();
    let skippingPages = new Array();
    const missingPages = await this._interfaceData.ping();
    missingPages.forEach((page, index, pages) => {
      if (page.mdn_exists) {
        skippingPages.push([page.type, page.key]);
      } else {
        // if (NOT_NEEDED.includes(page.type.toLowerCase())) { return; }
        const newPage = new Page(page.name, page.type, sharedQuestions);
        this._pages.push(newPage);
      }
    });
    if (skippingPages.length > 0) {
      let msg = '\nThe following pages from this interface already exist. You will not be asked\nquestions about them.\n';
      for (let s of skippingPages) {
        msg += `\t ${s[1]} ${s[0]}\n`;
      }
      utils.sendUserOutput(msg);
      await utils.pause();
    }
    if (missingPages === 0) {
      let msg = 'No MDN pages have been created for this interface.';
      utils.sendUserOutput(msg)
    }
  }

  async _writeBCD() {
    let name = this._interfaceData.name;
    if (bcd.api[name] && this.verbose) {
      const msg = `\nA BCD file already exists for ${name}. You will need to manually\nverify it for completeness.\n`;
      utils.sendUserOutput(msg);
      return;
    }
    let bcdm = new BCDBuilder(this._interfaceData, { verbose: this.verbose });
    let outFilePath = this._resolveBCDPath(name);
    await bcdm.write(outFilePath);
  }

  _resolveBCDPath(name) {
    let bcdPath;
    try {
      bcdPath = utils.getBCDPath();
      bcdPath = `${bcdPath}api/${name}.json`;
    } catch (error) {
      bcdPath = utils.makeFolder(name);
      bcdPath = `${bcdPath}${name}.json`;
    } finally {
      return bcdPath;
    }
  }

  async build() {
    await this._writeBCD();
    if (this._jsonOnly) { return; }
    await this._initPages();
    let msg;
    if (this._pages.length === 0) {
      msg = '\nThere are no undocumented members for this interface.\n';
      utils.sendUserOutput(msg);
      return;
    }
    for (let p of this._pages) {
      if (this._interactive) {
        await p.askQuestions();
      }
      await p.write();
    }
    msg = `\nMDN drafts were written to ${utils.getOutputDirectory()}${this._interfaceData.name}.`
    utils.sendUserOutput(msg);
  }

}

module.exports.pageExists = pageExists;
module.exports.CLIBuilder = _CLIBuilder;
module.exports.CSSBuilder = _CSSBuilder;
module.exports.IDLBuilder = _IDLBuilder;
