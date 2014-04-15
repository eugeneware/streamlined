var through2 = require('through2'),
    pathos = require('pathos');

module.exports = select;
function select(paths) {
  var s = through2.obj(write);
  function write(o, enc, cb) {
    var data = [];
    paths.forEach(function (path) {
      var val = pathos.walk(o, path);
      if (typeof val !== 'undefined') {
        data.push(val);
      }
    });

    if (data.length === paths.length) {
      this.push(data);
    }

    cb();
  }
  return s;
}
