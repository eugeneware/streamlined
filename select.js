var through2 = require('through2'),
    pathos = require('pathos'),
    selector = require('./selector');

module.exports = select;
function select(colExprs, build) {
  if (typeof build === 'undefined') build = false;
  if (!Array.isArray(colExprs)) {
    colExprs = [colExprs];
  }
  var s = through2.obj(write);

  var locators = [];
  colExprs.forEach(function (colExpr, i) {
    var locator = selector(colExpr, build);
    locators[i] = locator;
  });

  function write(o, enc, cb) {
    var data = [];
    for (var i = 0; i < colExprs.length; i++) {
      var locator = locators[i];
      var val = locator(o);
      if (typeof val !== 'undefined') {
        data.push(val);
      }
    }

    if (data.length === colExprs.length) {
      if (build) {
        data = pathos.build(data);
      }
      this.push(data);
    }

    cb();
  }

  return s;
}
