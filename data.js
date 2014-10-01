var through2 = require('through2');

function noop() { }

module.exports = data;
function data(onData, onEnd) {
  var s = through2.obj(write, end);
  onData = (typeof onData === 'function') ? onData : noop;
  onEnd = (typeof onData === 'function') ? onEnd : noop;

  function write(data, enc, cb) {
    onData(data);
    this.push(data);
    cb();
  }

  function end() {
    onEnd();
  }

  return s;
}
