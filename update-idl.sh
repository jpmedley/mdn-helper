#!/bin/sh

IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/renderer.tar.gz'

rm -rf idl/

curl $IDL_ZIP > idl.tar.gz

mkdir idl/
tar xvzf idl.tar.gz -C idl/

rm idl.tar.gz

mkdir idl/_test/
