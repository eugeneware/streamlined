var through2 = require('through2'),
    pathos = require('pathos');

module.exports = missing;
function missing(path) {
  var s = through2.obj(write);

  function write(o, enc, cb) {
    var data = o.value;
    var val = pathos.walk(data, path);
    if (typeof val === 'undefined') {
      this.push(data);
    }
    cb();
  }

  return s;
}
