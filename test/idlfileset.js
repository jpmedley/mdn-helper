'use strict';

const assert = require('assert');
const fs = require('fs');

const { IDLFileSet } = require('../idlfileset.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/exp_flags.json5');

const IDL_FILES = './test/files/';

describe('IDLFileSet', () => {
  describe('files', () => {
    it('Confirms that the file set includes an interface in an origin trials', () => {
      const allFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = allFiles.files;
      const OTFound = find('interface-origintrial.idl', files);
      assert.ok(OTFound);
    });
    it('Confirms that the file set includes an interface behind a flag', () => {
      const allFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = allFiles.files;
      const RTFound = find('interface-runtimeenabled.idl', files);
      assert.ok(RTFound);
    });
    it('Confirms that the file set does not include an interface behind a flag', () => {
      const someFiles = new IDLFileSet(IDL_FILES, {
        experimental: false,
        originTrial: false
      });
      let files = someFiles.files;
      const RTNotFound = find('interface-runtimeenabled.idl', files);
      assert.equal(RTNotFound, false);
    });
    it('Confirms that all 29 test IDL files are processed', () => {
      const someFiles = new IDLFileSet(IDL_FILES, {
        experimental: true,
        originTrial: true
      });
      let files = someFiles.files;
      assert.equal(files.length, 32);
    });
  });



  // describe('writeKeys()', () => {
  //   it('Returns true when the save file contains all unflagged keys', () => {
  //     const keySet = new IDLFileSet(IDL_FILES, {
  //       experimental: false,
  //       originTrial: false
  //     });
  //     const keyFile = './keyfile.txt';
  //     if (fs.existsSync(keyFile)) { fs.unlinkSync(keyFile) }
  //     keySet.writeKeys(keyFile);
  //     const keyFileContents = fs.readFileSync(keyFile).toString();
  //     const keys = keyFileContents.split('\n');
  //     assert.equal(keys.length, 10);
  //     fs.unlinkSync(keyFile);
  //   })
  // });
});

function find(file, inFiles) {
  for (let f of inFiles) {
    if (f.name === file) {
      console.log(f.name)
      return true;
    }
  }
  return false;
}