#!/bin/sh

npm run burn bcd -- -c api -b all
npm run burn bcd -- -c css -b all
npm run burn bcd -- -c html -b all
npm run burn bcd -- -c javascript -b all
npm run burn bcd -- -c mathml -b all
npm run burn bcd -- -c webextensions -b all

npm run burn chrome

npm run burn urls -- -c api
npm run burn urls -- -c css
npm run burn urls -- -c html
npm run burn urls -- -c javascript
npm run burn urls -- -c mathml
npm run burn urls -- -c webextensions