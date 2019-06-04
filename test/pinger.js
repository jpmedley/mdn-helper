'use strict';

const assert = require('assert');

const { EMPTY_BURN_DATA } = require('../interfacedata.js');
const { Pinger } = require('../pinger.js');


describe('Pinger', () => {
  describe('pingRecords', () => {
    it('Returns true when the record\'s url is found', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/Event'
      record.type = "reference"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      pinger.pingRecords(false)
      .then(records => {
        assert.ok(records[0].mdn_exists);
      });
    });

    it('Returns true when the record\'s url does not exist', () => {
      let record = Object.assign({}, EMPTY_BURN_DATA);
      record.bcd = true;
      record.key = "Event";
      record.mdn_url = 'https://developer.mozilla.org/docs/Web/API/Events'
      record.type = "reference"
      let records = [];
      records.push(record);
      const pinger = new Pinger(records);
      pinger.pingRecords(false)
      .then(records => {
        assert.equal(records[0].mdn_exists, false);
      })
    })
  });
});