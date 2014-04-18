var through2 = require('through2');

module.exports = map;
function map() {
  var fns = Array.prototype.slice.call(arguments);
  var s = through2.obj(write);

  function write(data, enc, cb) {
    fns.forEach(function (fn) {
      data = fn(data);
    });
    this.push(data);
    cb();
  }

  return s;
}
