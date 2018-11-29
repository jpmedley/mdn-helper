'use strict';

const { APIIndex } = require('./api_index.js');

const indexFile = 'idl/idlindex.txt';
const ind = new APIIndex(indexFile);
ind.find('XR');
