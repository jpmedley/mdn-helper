'use strict';

const assert = require('assert');
const fs = require('fs');

const { BCDManager } = require('../bcdmanager.js');
const { InterfaceData } = require('../interfacedata.js');
const utils = require('../utils.js');

const BURNABLE = {
  name: 'burnable',
  path: function() { return './test/files/burn-records.idl'; }
}

describe('BCDManager', () => {
  describe('getBCD()', () => {
    before(() => {
      utils.deleteUnemptyFolder('tmp/');
    })
    it('Confirms that a BCD file is written', () => {
      const id = new InterfaceData(BURNABLE);
      const bcdManager = new BCDManager();
      utils.makeFolder('tmp/');
      const outPath = 'tmp/test-bcd.json';
      const resultPath = bcdManager.getBCD(id, outPath);
      assert.ok(fs.existsSync(resultPath));
    });
    after(() => {
      utils.deleteUnemptyFolder('tmp/');
    })
  });
});