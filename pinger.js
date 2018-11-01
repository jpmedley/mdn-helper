'use strict';

const https = require('https');

const RECOVERABLE_ERRORS = 'ECONNRESET,EPROTO,ETIMEDOUT';
// const REQUEST_OPTIONS = {
//   protocol: 'https:',
//   hostname: 'developer.mozilla.org',
//   path: ''
// }
const REQUEST_OPTIONS = {
  protocol: 'http',
  hostname: 'localhost',
  port: 8000,
  path: ''
}

const Status = Object.freeze({
  "complete": 0,
  "needsretry": 1
});

class Pinger {
  constructor(records, httpOptions) {
    this._records = records;
    this._httpOptions = httpOptions;
  }

  pingRecords() {
    for (let r of this._records) {
      let retryCount = 3;
      while (retryCount > 0) {
        //START HERE: Test the catch() block.
        let status = await this._ping(r)
        .catch(e => {
          console.log(e);
        });
        if (status.needsretry) {
          retryCount--;
          if (retryCount == 0) { r.mdn_exists = false; }
        }
        else if (status.complete) { retryCount = 0; }
      }
    }
    return this._records;
  }

  _ping(record) {
    return new Promise((resolve, reject) => {
      try {
//         let base = REQUEST_OPTIONS.protocol + '//' + REQUEST_OPTIONS.hostname;
        let base = 'https://developer.mozilla.org';
        REQUEST_OPTIONS.path = record.mdn_url.replace(base, 'en-US');
        https.get(REQUEST_OPTIONS, (res) => {
          const status = res.statusCode.toString();
          if (status.match(/3\d\d/)) {
            throw new Error('Need to implement redirect.');
          }
          if (status.match(/4\d\d/)) {
            record.mdn_exists = false;
            resolve(Status.complete);
          }
          if (status.match(/5\d\d/)) {
            resolve(Status.needsretry);
          }
          res.on('data', (chunk) => {
            res.resume();
          });
          res.on('end', () => {
            if (status.match(/2\d\d/)) {
              record.mdn_exists = true;
              resolve(Status.complete);
            }
          });
          res.on('error', (e) => {
            if (RECOVERABLE_ERRORS.includes(e.code)) {
              resolve(Status.needsretry);
            }
            else {
              reject(e);
            }
          });
        });
      } catch(e) {
        reject(e);
      }
    })
  }
}

module.exports.Pinger = Pinger;
