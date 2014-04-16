var through2 = require('through2'),
    selector = require('defunct/selector');

module.exports = missing;
function missing(selectorExpr) {
  var s = through2.obj(write);

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
    if (typeof val === 'undefined') {
      this.push(data);
    }
    cb();
  }

  return s;
}
