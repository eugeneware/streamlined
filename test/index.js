var redtape = require('redtape'),
    fs = require('fs'),
    path = require('path'),
    JSONStream = require('JSONStream'),
    bl = require('bl'),
    d = require('defunct'),
    sl = require('..');

var it = redtape({
  beforeEach: function (cb) {
    var events =
      fs.createReadStream(path.join(__dirname, 'fixtures', 'events.json'))
      .pipe(JSONStream.parse());
    cb(null, events);
  }
});

it('should be able to limit a stream', 1, function(t, events) {
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

it('should be able to head a stream', 1, function(t, events) {
  var count = 0;
  events
    .pipe(sl.head(5))
    .on('data', function (data) {
      count++;
    })
    .on('end', function () {
      t.equal(count, 5, 'only 5 events');
      t.end();
    });
});

it('should be able to generate a keystream', 15, function(t, events) {
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

it('should be able to limit a stream by bytes', 2, function(t, events) {
  var count = 0;
  events
    .pipe(sl.limitBytes(1024))
    .pipe(JSONStream.stringify('', '', ''))
    .pipe(bl(function (err, data) {
      t.notOk(err, 'no bl error');
      t.ok(data.length < 1024, 'less than limit');
      t.end();
    }))
});

it('should be able to tail a stream', 6, function(t, events) {
  var count = 0;
  function counter() {
    var count = 0;
    return function (data) {
      return count++;
    };
  }
  events
    .pipe(sl.key(counter()))
    .pipe(sl.tail(5))
    .on('data', function (data) {
      t.ok(data.key >= 1833, 'last 5 items');
      count++;
    })
    .on('end', function () {
      t.equal(count, 5, 'only 5 events');
      t.end();
    });
});
