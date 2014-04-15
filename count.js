var through2 = require('through2');
module.exports = count;
function count() {
  var _count = 0;
  var s = through2.obj(write, end);

  function write(o, enc, cb) {
    _count++;
    cb();
  }

  function end() {
    this.push({ count: _count });
    this.push(null);
  }

  return s;
}
