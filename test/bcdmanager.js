'use strict';

const assert = require('assert');
const fs = require('fs');
const Validator = require('jsonschema').Validator;

const { BCDManager } = require('../bcdmanager.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');

// https://www.npmjs.com/package/diff

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}

describe('BCDManager', () => {
  describe('getBCD()', () => {
    const tempFolder = 'tmp/';
    const jsonPath = `${tempFolder}test-bcd.json`;

    beforeEach(() => {
      utils.deleteUnemptyFolder(tempFolder);
      utils.makeFolder(tempFolder);
    });

    it('Confirms that a BCD file is written', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager();
      const resultPath = bcdManager.getBCD(id, jsonPath);
      assert.ok(fs.existsSync(resultPath));
    });

    it('Confirms that the written BCD file is valid', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager();
      const resultPath = bcdManager.getBCD(id, jsonPath);
      let buffer = fs.readFileSync('test/files/compat-data.schema.json');
      const schema = [buffer.toString()];
      buffer = fs.readFileSync(resultPath);
      const result = JSON.parse(buffer.toString()).api;
      const validator = new Validator();
      console.log(validator.validate(result, schema));
    })

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });
});