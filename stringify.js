// helper stream to JSONify objects
var stream = require('stream');

module.exports = stringify;
function stringify() {
  var s = stream.Transform({ objectMode: true });
  s._transform = function (data, enc, cb) {
    s.push(JSON.stringify(data) + '\n');
    cb();
  };
  return s;
}
