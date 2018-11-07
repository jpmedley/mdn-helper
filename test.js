'use strict';

const bcd = require('mdn-browser-compat-data');

let cps = bcd;
for (let p in cps) {
  console.log(p);
}
