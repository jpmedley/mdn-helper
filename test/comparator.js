'use strict';

const assert = require('assert');
const fs = require('fs');
const { Comparator } = require('../comparator.js');

const CURRENT_TAG = '6f24c195641ec14b5752dda33a052fb45279c81e';
const PREVIOUS_TAG = 'cf8a81862c67e459cb122641c8d09e04f7b62ede';

describe('Comparator', ()=> {
  describe('constructor', () => {
    // Timeouts don't work with array functions.
    it('Successfully downloads IDL files for the supplied hashes', function(done) {
      // this.timeout(0);
      const comp = new Comparator(CURRENT_TAG, PREVIOUS_TAG);
      let contents = fs.readdirSync('./current', {withFileTypes: true});
      // console.log(contents);
      assert.equal(contents[0].name, 'core');
    });
  });
});