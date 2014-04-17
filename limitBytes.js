var through2 = require('through2');

module.exports = limitBytes;
function limitBytes(max) {
  var s = through2.obj(write, end);
  var count = 0;
  var ended = false;

  function write(data, enc, cb) {
    var dataLength = Buffer.byteLength(JSON.stringify(data));
    if ((count + dataLength) <= max) {
      this.push(data);
    }
    count += dataLength;

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
