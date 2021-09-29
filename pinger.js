// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

const https = require('https');

const RECOVERABLE_ERRORS = 'ECONNRESET,EPROTO,ETIMEDOUT';
let REQUEST_OPTIONS = {
  hostname: 'developer.mozilla.org',
  path: ''
}
const MDN = "https://" + REQUEST_OPTIONS.hostname;
const RETRY_COUNT = 5;
const STATUS_NEEDS_RETRY = 0;
const STATUS_COMPLETE = 1;

class Pinger {
  constructor(records, httpOptions) {
    this._records = records;
    this._httpOptions = httpOptions;
  }

  async pingRecords(verboseOutput = false) {
    for (let r of this._records) {
      if (!r.mdn_url) { continue; }
      if (r.mdn_url === "No URL found in compatibility data") { continue; }
      if (verboseOutput) { console.log(r.key); }
      let retryCount = RETRY_COUNT;
      while (retryCount > 0) {
        let status = await this._ping(r)
        .catch(e => {
          console.log(e);
        });
        if (status == STATUS_NEEDS_RETRY) {
          retryCount--;
          if (retryCount == 0) { r.mdn_exists = false; }
        }
        else if (status == STATUS_COMPLETE) { retryCount = 0; }
      }
    }
    return this._records;
  }

  _ping(record) {
    return new Promise((resolve, reject) => {
      try {
        REQUEST_OPTIONS.path = record.mdn_url.replace(MDN, '/en-US');
        https.get(REQUEST_OPTIONS, (res) => {
          const status = res.statusCode.toString();
          let code;
          if (status.match(/3\d\d/)) {
            record.mdn_exists = false;
            record.redirect = true;
            code = STATUS_COMPLETE;
            resolve(code);
          }
          if (status.match(/4\d\d/)) {
            record.mdn_exists = false;
            // For some reason the const doesn't survive resolve().
            code = STATUS_COMPLETE;
            resolve(code);
          }
          if (status.match(/5\d\d/)) {
            code = STATUS_NEEDS_RETRY;
            resolve(code);
          }
          res.on('data', (chunk) => {
            res.resume();
          });
          res.on('end', () => {
            if (status.match(/2\d\d/)) {
              record.mdn_exists = true;
              record.redirect = false;
              code = STATUS_COMPLETE;
              resolve(code);
            }
          });
          res.on('error', (e) => {
            console.log(e);
            if (RECOVERABLE_ERRORS.includes(e.code)) {
              // resolve(Status.needsretry);
              code = STATUS_NEEDS_RETRY;
              resolve(code);
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
