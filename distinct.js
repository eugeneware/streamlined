var through2 = require('through2'),
    selector = require('./selector');

module.exports = distinct;
function distinct(selectorExpr, aggregate) {
  if (typeof aggregate === 'undefined') aggregate = true;
  var s = through2.obj(write, end);
  var types = {};

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
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
