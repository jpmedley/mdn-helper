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

const { METAFILE } = require('../fileprocessor.js');

//Object.assign({}, METAFILE);
      // mf.path = 'one.idl';
      // mf.key = 'Widget';
      // mf.keys = ['Widget', 'Widget.method', 'method.property'];
      // mf.type = 'interface';
      // INTERFACE_SET.add(mf);

      
const BURNABLE = Object.assign({}, METAFILE);
BURNABLE.path = './test/files/burn-records.idl';
BURNABLE.type = 'interface';

const CONSTRUCTOR = Object.assign({}, METAFILE);
CONSTRUCTOR.path = './test/files/constructor-noarguments.idl';
CONSTRUCTOR.type = 'interface';

const EXPERIMENTAL = Object.assign({}, METAFILE);
EXPERIMENTAL.path = './test/files/interface-runtimeenabled.idl';
EXPERIMENTAL.type = 'interface';

const METHODS = Object.assign({}, METAFILE);
METHODS.path = './test/files/methods.idl';
METHODS.type = 'interface';

const NO_FLAGS = Object.assign({}, METAFILE);
NO_FLAGS.path = './test/files/interface-noinherits.idl';
NO_FLAGS.type = 'interface';

const ORIGIN_TRIAL = Object.assign({}, METAFILE);
ORIGIN_TRIAL.path = './test/files/interface-origintrial.idl';
ORIGIN_TRIAL.type = 'interface';

const PING_EXISTS = Object.assign({}, METAFILE);
PING_EXISTS.path = './test/files/ping-exists.idl';
PING_EXISTS.type = 'interface';

const PING_MISSING = Object.assign({}, METAFILE);
PING_MISSING.path = './test/files/ping-missing.idl';
PING_MISSING.type = 'interfaces';

const PROPERTIES = Object.assign({}, METAFILE);
PROPERTIES.path = './test/files/properties.idl';
PROPERTIES.type = 'interfaces';

const SECURE_CONTEXT = Object.assign({}, METAFILE);
SECURE_CONTEXT.path = './test/files/interface-securecontext.idl';
SECURE_CONTEXT.type = 'interfaces';

const STABLE = Object.assign({}, METAFILE);
STABLE.path = './test/files/interface-rte-stable.idl';
STABLE.type = 'interface';

const TEST = Object.assign({}, METAFILE);
TEST.path = './test/files/interface-rte-test.idl';
TEST.type = 'interfaces';

const UNFAMILLIAR = Object.assign({}, METAFILE);
UNFAMILLIAR.path = './test/files/interface-rte-medley.idl';
UNFAMILLIAR.type = 'interfaces';

module.exports = {
  BURNABLE: BURNABLE,
  CONSTRUCTOR: CONSTRUCTOR,
  EXPERIMENTAL: EXPERIMENTAL,
  METHODS: METHODS,
  NO_FLAGS: NO_FLAGS,
  ORIGIN_TRIAL: ORIGIN_TRIAL,
  PING_EXISTS: PING_EXISTS,
  PING_MISSING: PING_MISSING,
  PROPERTIES: PROPERTIES,
  SECURE_CONTEXT: SECURE_CONTEXT,
  STABLE: STABLE,
  TEST: TEST,
  UNFAMILLIAR: UNFAMILLIAR
}