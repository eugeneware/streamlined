var through2 = require('through2'),
    selector = require('./selector');

module.exports = select;
function select(colExprs) {
  var s = through2.obj(write);

  var locators = [];
  colExprs.forEach(function (colExpr, i) {
    var locator = selector(colExpr);
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
      this.push(data);
    }

    cb();
  }

  return s;
}
