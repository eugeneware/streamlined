var through2 = require('through2'),
    pathos = require('pathos');

module.exports = where;
function where(path, needle) {
  var s = through2.obj(write);
  var types = {};

  function write(data, enc, cb) {
    var val = pathos.walk(data, path);
    if (val === needle) {
      this.push(data);
    }
    cb();
  }

  return s;
}
