var through2 = require('through2');

module.exports = limit;
function limit(max) {
  var s = through2.obj(write, end);
  var count = 0;
  var ended = false;

  function write(data, enc, cb) {
    if (count < max) {
      this.push(data);
    }
    count++;

    if (count > max && !ended) {
      ended = true;
      this.push(null);
    }

    cb();
  }

  function end() {
    if (!ended) {
      this.push(null);
    }
  }

  return s;
}
