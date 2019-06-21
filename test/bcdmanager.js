'use strict';

const assert = require('assert');
const fs = require('fs');

const { BCDManager } = require('../bcdmanager.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');

// https://www.npmjs.com/package/diff

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}
const ILLFORMED = {
  name: 'illformed',
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

    afterEach(() => {
      utils.deleteUnemptyFolder('tmp/');
    });
  });
});