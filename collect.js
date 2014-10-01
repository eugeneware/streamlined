var through2 = require('through2');

function noop() { }

module.exports = collect;
function collect(onEnd) {
  var s = through2.obj(write, end);
  var results = [];
  var err = null;

  onEnd = (typeof onEnd === 'function') ? onEnd : noop;

  function write(data, enc, cb) {
    results.push(data);
    this.push(data);
    cb();
  }

  s.on('error', function (err_) {
    err = err_;
  });

  function end() {
    onEnd(err, results);
  }

  return s;
}
