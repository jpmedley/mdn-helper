'use string';

const assert = require('assert');

const { InterfaceData, IDLFlagError } = require('../interfacedata.js');

const FLAGS_JSON = './test/files/test_flags.json5';

const PSEUDO_DIRENTS = [
  {
    name: 'flagged',
    path: function() { return './test/files/interface-runtimeenabled.idl'; }
  },
  {
    name: 'originTrial',
    path: function() { return './test/files/interface-origintrial.idl'; }
  }
];

describe('InterfaceData', () => {
  let id;

  describe('constructor', () => {
    // To see this error, both flags and OTs must be excluded.
    it('Throws when a complete interface is marked both RuntimeEnabled and OriginTrialEnabled', () => {
      assert.throws(
        () => {
          id = new InterfaceData(PSEUDO_DIRENTS[0], {
            experimental: false,
            flagPath: FLAGS_JSON,
            originTrial: false
          });
        }, IDLFlagError
      );
    });
  });


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
      });
    });
  };
});