var through2 = require('through2'),
    selector = require('defunct/selector');

module.exports = funnel;
function funnel(userSelector, eventSelector, events) {
  var s = through2.obj(write, end);

  var userLocator = selector(userSelector);
  var eventLocator = selector(eventSelector);

  var users = {};
  var results = {};
  events.forEach(function (evt, i) {
    results[evt] = 0;
  });

  function write(data, enc, cb) {
      var evt = eventLocator(data);
      var userId = userLocator(data);

      var funnelEvent = events.indexOf(evt)
      users[userId] = users[userId] || 0;

      // if event is in right order then increment stats
      if (funnelEvent === users[userId]) {
        users[userId] = funnelEvent + 1;
        results[evt]++;
      }
    cb();
  }

  function end() {
    this.push(results);
    this.push(null);
  }

  return s;
}
