#!/bin/sh

IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/renderer.tar.gz'

# Don't delete idl/. It contains a test/ directory which is needed.
rm -rf idl/core/
rm -rf idl/modules/
rm -rf idl/platform/

if [ ! -d "idl" ]; then
  mkdir idl
fi

echo '\nDownloading IDL and related data files.\n'
curl $IDL_ZIP > idl.tar.gz

tar -C idl/ -xvf idl.tar.gz core/*.idl
tar -C idl/ -xvf idl.tar.gz modules/*.idl
tar -C idl/ -xvf idl.tar.gz platform/runtime_enabled_features.json5

rm idl.tar.gz

echo '\nInstalling latest browser compatibility data.\n'
npm install mdn-browser-compat-data@latest
