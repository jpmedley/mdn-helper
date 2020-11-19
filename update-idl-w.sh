# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

#!/bin/sh

IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/renderer.tar.gz'
if [ ! -z "$1" ]; then
  URL=$1
else
  URL=$IDL_ZIP
fi

if [ ! -z "$2" ]; then
  IDL_ROOT=$2
else
  IDL_ROOT='idl/'
fi

# Don't delete idl/. It contains a test/ directory which is needed.
rm -rf $IDL_ROOT/core/
rm -rf $IDL_ROOT/modules/
rm -rf $IDL_ROOT/platform/

if [ ! -d $IDL_ROOT ]; then
  mkdir $IDL_ROOT
fi

echo '\nDownloading IDL and related data files from Chrome source code.\n'
curl $URL > idl.tar.gz

tar --wildcard -C $IDL_ROOT/ -xf idl.tar.gz core/*.idl
tar --wildcard -C $IDL_ROOT/ -xf idl.tar.gz core/css/*.json5
tar --wildcard -C $IDL_ROOT/ -xf idl.tar.gz modules/*.idl
tar --wildcard -C $IDL_ROOT/ -xf idl.tar.gz platform/runtime_enabled_features.json5

rm idl.tar.gz

if [ -z $3 ]; then
  echo '\nInstalling latest browser compatibility data.\n'
  npm install @mdn/browser-compat-data@latest
  curl https://raw.githubusercontent.com/mdn/browser-compat-data/master/schemas/compat-data.schema.json > test/files/compat-data.schema.json
fi
