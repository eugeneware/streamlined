var through2 = require('through2');

function noop() { }

module.exports = collect;
function collect(onEnd) {
  var fns = Array.prototype.slice.call(arguments);
  var s = through2.obj(write, end);
  var results = [];
  var err = null;

  onEnd = fns.length ? fns : [ noop ];

  function write(data, enc, cb) {
    results.push(data);
    this.push(data);
    cb();
  }

  s.on('error', function (err_) {
    err = err_;
  });

  function end() {
    fns.forEach(function (fn) {
      fn(err, results);
    });
  }

  return s;
}
