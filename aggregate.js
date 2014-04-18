var through2 = require('through2'),
    selector = require('defunct/selector');

module.exports = aggregate;
function aggregate(selectorExpr, fns) {
  if (typeof fns === 'function') {
    // single arg
    fns = { single: fns };
  }

  var s = through2.obj(write, end);
  var accumulator = {};

  var locator = selector(selectorExpr);

  function write(data, enc, cb) {
    var val = locator(data);
    if (typeof val !== undefined) {
      accumulator[val] = Object.keys(fns)
        .reduce(function (acc, key) {
          var fn = fns[key];
          acc[key] = fn(acc[key], data, val);
          return acc;
        }, accumulator[val] || {});
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
