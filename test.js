'use strict';

const { bcd } = require('./bcd.js');

let pk = bcd.getPossibleKeys('background');
console.log("=".repeat(80));
console.log("SHOWING OUTPUT");
for (let k of pk) {
  console.log(k);
}
