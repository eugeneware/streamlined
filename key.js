var through2 = require('through2'),
    selector = require('defunct/selector');

function identity(data) {
  return data;
}

module.exports = key;
function key(selectorExpr, decorators) {
  if (typeof decorators == 'undefined') {
    decorators = [identity];
  } else {
    decorators = Array.prototype.slice.call(arguments, 1);
  }

  var s = through2.obj(write);
  var locator = selector(selectorExpr);
  function write(data, enc, cb) {
    key = locator(data);
    decorators.forEach(function (decorator) {
      key = decorator(key);
    });
    this.push({
      key: key,
      value: data
    });
    cb();
  }

  return s;
}
