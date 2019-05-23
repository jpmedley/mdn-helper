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

describe('InterfaceData', () => {


  let id;
  for (let p of PSEUDO_DIRENTS) {
    id = new InterfaceData(p, {
      experimental: true,
      originTrial: true,
      flagPath: './idl/_test/test_flags.json5'
    });

    describe(`${p.name}`, () => {
      it(`Returns true when the source IDL is ${p.name}.`, () => {
        assert.ok(id[p.name]);
      });
    });

    describe(`burnable`, () => {
      it(`Returns false when ${p.path()} is not burnable.`, () => {
        assert.equal(id.burnable, false);
      })
    })
  }


});