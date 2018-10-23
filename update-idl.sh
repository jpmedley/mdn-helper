#!/bin/sh
IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/48c7a8424cd9222a0f9001c923c259265b2222b9/third_party/blink/renderer.tar.gz'

rm -rf idl/

curl $IDL_ZIP > idl.tar.gz

mkdir idl/
tar xvzf idl.tar.gz -C idl/

rm idl.tar.gz
