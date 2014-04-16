var pathos = require('pathos');

module.exports = selector;
function selector(s, build) {
  if (typeof build === 'undefined') build = false;

  if (typeof s === 'string') {
    // treat string as a path
    s = s.split('.');
  }

  if (typeof s === 'function') {
    // function predicate
    return s;
  } else if (Array.isArray(s)) {
    // pathos
    if (build) {
      return function (data) {
        return {
          key: s,
          value: pathos.walk(data, s)
        };
      };
    } else {
      return function (data) {
        return pathos.walk(data, s);
      };
    }
  } else {
    // don't know, do pass through
    return function (s) {
      return true;
    };
  }
}
