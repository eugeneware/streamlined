var jsonquery = require('jsonquery'),
    pathos = require('pathos');

module.exports = selector;
function selector(s) {
  if (typeof s === 'string') {
    // treat string as a path
    s = s.split('.');
  }

  if (typeof s === 'function') {
    // function predicate
    return s;
  } else if (Array.isArray(s)) {
    // pathos
    return function (data) {
      return pathos.walk(data, s);
    };
  } else if (typeof s === 'object' && Object.keys(s).length) {
    return function (data) {
      return jsonquery.match(data, s);
    };
  } else {
    // don't know, do pass through
    return function (s) {
      return true;
    };
  }
}
