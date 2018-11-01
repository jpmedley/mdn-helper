'use strict';


const { Pinger } = require('./pinger.js');

const HTTP_OPTIONS = {
  protocol: 'https:',
  hostname: 'developer.mozilla.org',
  path: ''
}

class PingManager {
  constructor(pingRecords) {
    this._pingRecords = pingRecords;
    this._pinger = new Pinger(HTTP_OPTIONS);
    HTTP_OPTIONS.base = HTTP_OPTIONS.protocol + "//" + HTTP_OPTIONS.hostname + "/";
    this._done = false;

    this._pinger.addListener('needsretry', (record) => {
      if (record.retry > 0) {
        record.retry--;
        this.pingRecords();
      }
    });

    this._pinger.addListener('missing', (record) => {
      record.mdn_exists = false;
      this.pingRecords();
    });

    this._pinger.addListener('found', (record) => {
      record.mdn_exists = true;
      this.pingRecords();
    });
  }

  get done() {
    return this._done;
  }

  pingRecords() {
    let nextRecord = this._pingRecords.find((record) => {
      return record.retry > 0;
    });
    // if (!nextRecord) { return; }
    if (!nextRecord) { this._done = true; }
    nextRecord.url = nextRecord.mdn_url.replace(HTTP_OPTIONS.base, 'en-US/')
    try {
      this._pinger.ping(nextRecord);
    } catch (e) {
      throw e;
    }
  }
}

module.exports.PingManager = PingManager;
