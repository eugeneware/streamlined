var through2 = require('through2'),
    selector = require('defunct/selector');

module.exports = aggregate;
function aggregate(selectorExpr, fns, dropUndefined) {
  if (typeof fns === 'function') {
    // single arg
    fns = { single: fns };
  }
  if (typeof dropUndefined === 'undefined') {
    dropUndefined = false;
  }

  var s = through2.obj(write, end);
  var accumulator = {};

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
    if (typeof val !== undefined) {

      var newVal = Object.keys(fns)
        .reduce(function (acc, key) {
          var fn = fns[key];
          var newVal = fn(acc[key], data, val);
          if (typeof newVal !== 'undefined' || dropUndefined === false) {
            acc[key] = newVal;
          }
          return acc;
        }, accumulator[val] || {});

      if (Object.keys(newVal).length || dropUndefined === false) {
        accumulator[val] = newVal;
      }
    }
    cb();
  }

  function end() {
    var keys = Object.keys(fns);
    if (keys.length === 1) {
      // flatten
      var key = keys[0];
      var flattened = {};
      Object.keys(accumulator).forEach(function (k) {
        flattened[k] = accumulator[k][key];
      });
      this.push(flattened);
    } else {
      this.push(accumulator);
    }
    this.push(null);
  }

  return s;
}
