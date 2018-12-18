#!/bin/sh

IDL_ZIP='https://chromium.googlesource.com/chromium/src/+archive/HEAD/third_party/blink/renderer.tar.gz'

rm -rf idl/core/
rm -rf idl/modules/

curl $IDL_ZIP > idl.tar.gz

tar -C idl/ -xvf idl.tar.gz core/
tar -C idl/ -xvf idl.tar.gz modules/

rm idl.tar.gz
