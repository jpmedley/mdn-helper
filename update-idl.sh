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

echo '\nDownloading IDL and related data files.\n'
curl $URL > idl.tar.gz

tar -C $IDL_ROOT/ -xf idl.tar.gz core/*.idl
tar -C $IDL_ROOT/ -xf idl.tar.gz modules/*.idl
tar -C $IDL_ROOT/ -xf idl.tar.gz platform/runtime_enabled_features.json5

rm idl.tar.gz

if [ -z $3 ]; then
  echo '\nInstalling latest browser compatibility data.\n'
  npm install mdn-browser-compat-data@latest
  curl https://raw.githubusercontent.com/mdn/browser-compat-data/master/schemas/compat-data.schema.json > test/files/compat-data.schema.json
fi
