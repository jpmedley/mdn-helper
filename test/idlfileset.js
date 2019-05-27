'use strict';

const assert = require('assert');

const { IDLFileSet } = require('../idlfileset.js');

global.__Flags = require('../flags.js').FlagStatus('./test/files/test_flags.json5');

const IDL_FILES = './test/files/';

describe('IDLFileSet', () => {
  describe('files', () => {

    const allFiles = new IDLFileSet(IDL_FILES, {
      experimental: true,
      originTrial: true
    });
    let files = allFiles.files;
    const OTFound = find('interface-origintrial.idl', files);
    it('Returns true if the file set includes an interface in an origin trials', () => {
      assert.ok(OTFound);
    });
    const RTFound = find('interface-runtimeenabled.idl', files);
    it('Returns true if the file set includes an interface behind a flag', () => {
      assert.ok(RTFound);
    });

    const someFiles = new IDLFileSet(IDL_FILES, {
      experimental: false,
      originTrial: false
    });
    files = someFiles.files;
    const OTNotFound = find('interface-origintrial.idl', files);
    it('Returns false if the file set does not include an interface in an origin trials', () => {
      assert.equal(OTNotFound, false);
    });
    const RTNotFound = find('interface-runtimeenabled.idl', files);
    it('Returns false if the file set does not include an interface behind a flag', () => {
      assert.equal(RTNotFound, false);
    });
  });

  // describe('saveKeys', () => {
  //   const ketSet = new IDLFileSet(IDL_FILES, {
  //     experimental: false,
  //     originTrial: false
  //   });
  // });
});

function find(file, inFiles) {
  for (let f of inFiles) {
    if (f.name === file) {
      return true;
    }
  }
  return false;
}