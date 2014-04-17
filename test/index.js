var redtape = require('redtape'),
    fs = require('fs'),
    path = require('path'),
    JSONStream = require('JSONStream'),
    d = require('defunct'),
    sl = require('..');

var it = redtape({
  beforeEach: function (cb) {
    var events =
      fs.createReadStream(path.join(__dirname, 'fixtures', 'events.json'))
      .pipe(JSONStream.parse());
    cb(null, events);
  },
  afterEach: function (cb) {
    cb();
  }
});

it('should be able to limit a stream', function(t, events) {
  var count = 0;
  events
    .pipe(sl.limit(5))
    .on('data', function (data) {
      count++;
    })
    .on('end', function () {
      t.equal(count, 5, 'only 5 events');
      t.end();
    });
});

it('should be able to generate a keystream', function(t, events) {
  events
    .pipe(sl.limit(5))
    .pipe(sl.key('properties.time', d.mul(1000), d.monotonic()))
    .on('data', function (data) {
      t.equal(typeof data.key, 'number', 'key should exist and be a number');
      t.equal(typeof data.value, 'object', 'value should exist and be an object');
      t.ok(data.value.event, 'event field should exist');
    })
    .on('end', function () {
      t.end();
    });
});

it('should be able to count a stream', 1, function(t, events) {
  events
    .pipe(sl.count())
    .on('data', function (data) {
      t.deepEqual(data, { count: 1838 });
    })
    .on('end', function () {
      t.end();
    });
});
