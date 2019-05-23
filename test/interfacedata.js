'use string';

const assert = require('assert');

const { InterfaceData } = require('../interfacedata.js');

const PSEUDO_DIRENTS = [
  {
    name: 'flagged',
    path: function() { return './idl/_test/interface-runtimeenabled.idl'; }
  },
  {
    name: 'originTrial',
    path: function() { return './idl/_test/interface-origintrial.idl'; }
  }
]

let id;
for (let p of PSEUDO_DIRENTS) {
  id = new InterfaceData(p, {
    experimental: true,
    originTrial: true,
    flagPath: './idl/_test/test_flags.json5'
  });
  
  describe('InterfaceData', () => {
    describe(`${p.name}`, () => {
      it(`Returns true when the source IDL is ${p.name}.`, () => {
        assert.ok(id.flagged);
      });
    });
  });
}