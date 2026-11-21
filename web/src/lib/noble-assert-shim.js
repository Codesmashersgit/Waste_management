const actual = require('@noble/hashes/_assert');

const anumber = actual.anumber || actual.number;
const abytes = actual.abytes || actual.bytes;
const ahash = actual.ahash || actual.hash;
const aexists = actual.aexists || actual.exists;
const aoutput = actual.aoutput || actual.output;

const number = anumber;
const bool = actual.bool || function (b) {
  if (typeof b !== 'boolean') throw new Error('boolean expected');
};
const bytes = abytes;
const hash = ahash;
const exists = aexists;
const output = aoutput;

module.exports = {
  anumber,
  abytes,
  ahash,
  aexists,
  aoutput,
  number,
  bool,
  bytes,
  hash,
  exists,
  output,
  default: { number, bool, bytes, hash, exists, output, anumber, abytes, ahash, aexists, aoutput },
};
