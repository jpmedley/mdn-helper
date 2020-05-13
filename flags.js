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

const fs = require('fs');
const json5 = require('json5');

const NO_FLAG = 'No flag found';

let flags;

class _FlagStatus {
  constructor(flagPath) {
    this._flagPath = flagPath;
    this._loadFlags();
  }

  _loadFlags() {
    const flagFileContents = fs.readFileSync(this._flagPath).toString();
    const flagArray = json5.parse(flagFileContents).data;
    for (let f of flagArray) {
      // this[f.name] = f.status;
      this[f.name] = f;
    }
  }

  getStableAsBoolean(key) {
    const flagData = this[key];
    if (flagData.status === 'stable') {
      return true;
    } else {
      return false;
    }
  }

  getActualStatus(key) {
    if (this[key]) {
      if (this[key].status) {
        return this[key].status;
      }
    }
    return NO_FLAG;
  }

  getPlatformStatus(key, platform) {
    const actualStatus = this.getActualStatus(key);
    if (actualStatus === NO_FLAG) {
      return 'stable';
    }
    if (typeof actualStatus === 'object') {
      return actualStatus[platform];
    }
  }

  getHighestResolvedStatus(key) {
    const actualStatus = this.getActualStatus(key);
    if (actualStatus === NO_FLAG) {
      return 'stable';
    }
    if (typeof actualStatus === 'object') {
      // If any part of the interface is stable, 
      if (Object.values(actualStatus).includes('stable')) {
        return 'stable';
      };

      // If stable isn't found, check if any part is experimental then
      if (Object.values(actualStatus).includes('experimental')) {
        if (Object.values(actualStatus).includes('origin_trial_feature_name')) {
          return 'origintrial'
        } else {
          return 'experimental';
        }
      }

      if (Object.values(actualStatus).includes('test')) {
        return 'test';
      }

      // If anything is left, 
      if (Object.values(actualStatus).includes('')) {
        return 'stable';
      }
    } else {
      if (this[key]) {
        if (this[key].origin_trial_feature_name) {
          return 'origintrial';
        }
      }
      return actualStatus;
    }
  }
}

function getFlagObject(flagPath) {
  if (!flags) {
    flags = new _FlagStatus(flagPath);
  }
  return flags;
}

module.exports.FlagStatus = getFlagObject;
module.exports.NO_FLAG = NO_FLAG;
