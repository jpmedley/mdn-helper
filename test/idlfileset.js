'use strict';

const assert = require('assert');

const { IDLFileSet } = require('../idlfileset.js');

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
      experimenal: false,
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
});

function find(file, inFiles) {
  console.log(file);
  for (let f of inFiles) {
    console.log(`\t${f.name}`);
    if (f.name === file) {
      // console.log('\tReturn true');
      return true;
    }
  }
  // console.log('\tReturn false');
  return false;
}