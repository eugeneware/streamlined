var through2 = require('through2'),
    selector = require('./selector');

module.exports = pluck;
function pluck(selectorExpr) {
  var s = through2.obj(write);

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
    if (typeof val !== undefined) {
      this.push(val);
    }
    cb();
  }

  return s;
}
