var through2 = require('through2');

module.exports = map;
function map(fn) {
  var s = through2.obj(write);

  function write(data, enc, cb) {
    this.push(fn(data));
    cb();
  }

  return s;
}
