var through2 = require('through2'),
    jsonquery = require('jsonquery'),
    selector = require('defunct/selector');

module.exports = where;
function where(selectorExpr, needle) {
  var s = through2.obj(write);
  var types = {};

  var predicate;
  if (typeof selectorExpr === 'object' && selectorExpr !== null &&
      typeof needle === 'undefined') {
    predicate = function (data) {
      jsonquery.match(data, selectorExpr);
    };
  } else {
    var locator = selector(selectorExpr);
    predicate = function (data) {
      var val = locator(data);
      return val === needle;
    };
  }

  function write(data, enc, cb) {
    if (predicate(data)) {
      this.push(data);
    }
    cb();
  }

  return s;
}
