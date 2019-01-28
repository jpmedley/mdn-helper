#!/bin/sh

IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/renderer.tar.gz'

# Don't delete idl/. It contains a test/ directory which is needed.
rm -rf idl/core/
rm -rf idl/modules/

if [ -d "idl" ]; then
  mkdir idl
fi

curl $IDL_ZIP > idl.tar.gz

tar -C idl/ -xvf idl.tar.gz core/*.idl
tar -C idl/ -xvf idl.tar.gz modules/*.idl

rm idl.tar.gz

npm install mdn-browser-compat-data@latest
