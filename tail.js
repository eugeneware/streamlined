var through2 = require('through2');

module.exports = tail;
function tail(max) {
  var s = through2.obj(write, end);
  var count = 0;
  var ended = false;

  var cache = [];

  function write(data, enc, cb) {
    cache.push(data);
    count++;

    if (count > max) {
      cache.shift();
    }

    cb();
  }

  function end() {
    var self = this;
    cache.forEach(function (data) {
      self.push(data);
    });
    self.push(null);
  }

  return s;
}
