var through2 = require('through2'),
    pathos = require('pathos');

module.exports = distinct;
function distinct(path, aggregate) {
  if (typeof aggregate === 'undefined') aggregate = true;
  var s = through2.obj(write, end);
  var types = {};

  function write(o, enc, cb) {
    var data = o.value;
    var val = pathos.walk(data, path);
    if (typeof val !== undefined) {
      types[val] = types[val] || 0;
      if (!aggregate && types[val] === 0) this.push(val);
      types[val]++;
    }
    cb();
  }

  function end() {
    if (aggregate) this.push(types);
    this.push(null);
  }

  return s;
}
