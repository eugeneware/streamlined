var through2 = require('through2'),
    selector = require('defunct/selector');

module.exports = where;
function where(selectorExpr, needle) {
  var s = through2.obj(write);
  var types = {};

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
    if (val === needle) {
      this.push(data);
    }
    cb();
  }

  return s;
}
