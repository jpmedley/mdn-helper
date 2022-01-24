// Copyright 2022 Google LLC
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

const { initiateLogger } = require('./log.js');

initiateLogger(global.__commandName);

class _FeatureSource_Base {
  constructor(rawSource, options) {

  }
}

class _IDLFeature_Base extends _FeatureSource_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class CSSFeature extends _FeatureSource_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class CallbackFeature extends _IDLFeature_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class DictionaryFeature extends _IDLFeature_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class EnumFeature extends _IDLFeature_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class IncludesFeature extends _IDLFeature_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class InterfaceFeature extends _IDLFeature_Base {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class MixinFeature extends InterfaceFeature {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

class PartialFeature extends InterfaceFeature {
  constructor(rawSource, options) {
    super(rawSource, options);
  }
}

export const {
  CallbackFeature,
  CSSFeature,
  DictionaryFeature,
  EnumFeature,
  InterfaceFeature,
  MixinFeature,
  PartialFeature
}