# Copyright 2020 Google LLC
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
IDL_ROOT='idl/'
FILE_NAME=$1

# Don't delete idl/. It contains a test/ directory which is needed.
rm -rf $IDL_ROOT/core/
rm -rf $IDL_ROOT/modules/
rm -rf $IDL_ROOT/platform/

if [ ! -d $IDL_ROOT ]; then
  mkdir $IDL_ROOT
fi

echo '\nDownloading IDL and related data files.\n'
curl $IDL_ZIP > idl.tar.gz

tar -C $IDL_ROOT/ -xf idl.tar.gz $FILE_NAME
tar -C $IDL_ROOT/ -xf idl.tar.gz core/css/*.json5
tar -C $IDL_ROOT/ -xf idl.tar.gz platform/runtime_enabled_features.json5

rm idl.tar.gz