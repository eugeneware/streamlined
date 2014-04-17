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

it('should be able to count disctinct properties', 1, function(t, events) {
  events
    .pipe(sl.distinct('properties.$browser'))
    .on('data', function (data) {
      var expected = {
        Safari: 156,
        Firefox: 349,
        Chrome: 822,
        'Mobile Safari': 229,
        'Internet Explorer': 160,
        'Android Mobile': 76,
        'Opera Mini': 6,
        'Chrome iOS': 26,
        undefined: 2,
        'Facebook Mobile': 2,
        Opera: 8,
        BlackBerry: 2
      };
      t.deepEqual(data, expected, 'should get distinct browser counts');
    })
    .on('end', function () {
      t.end();
    });
});

it('should be able to return items that are missing a field', 5,
  function(t, events) {
    var count = 0;
    events
      .pipe(sl.missing('properties.$browser'))
      .on('data', function (data) {
        count++;
        t.assert(['$campaign_delivery', '$campaign_open']
          .indexOf(data.event) !== -1, 'correct event');
        t.assert(typeof data.properties.$browser === 'undefined',
          'property is missing');
      })
      .on('end', function () {
        t.equal(count, 2, 'only be two results');
        t.end();
      })
  });

it('should be able to select certain fields', 1, function(t, events) {
  var results = [];
  events
    .pipe(sl.tail(5))
    .pipe(sl.select(['properties.time', 'properties.distinct_id']))
    .on('data', function (data) {
      results.push(data);
    })
    .on('end', function () {
      var expected = [
        [ 1395896604, '9f4533ce876717bc49b11fcb02015483' ],
        [ 1395896604, '9f4533ce876717bc49b11fcb02015483' ],
        [ 1395896610, '99766c220b35770d8fbe03f79cf326a7' ],
        [ 1395896610, 'b53293da8304e965c3d63a7b5bc7f0d4' ],
        [ 1395896611, '99766c220b35770d8fbe03f79cf326a7' ]
      ];
      t.deepEqual(results, expected, 'should get right rows');
      t.end();
    });
});

it('should be able to return the selected fields as an object', 1,
  function(t, events) {
    var results = [];
    events
      .pipe(sl.tail(5))
      .pipe(sl.select(['properties.time', 'properties.distinct_id'], true))
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        var expected = [
          { properties:
             { time: 1395896604,
               distinct_id: '9f4533ce876717bc49b11fcb02015483' } },
          { properties:
             { time: 1395896604,
               distinct_id: '9f4533ce876717bc49b11fcb02015483' } },
          { properties:
             { time: 1395896610,
               distinct_id: '99766c220b35770d8fbe03f79cf326a7' } },
          { properties:
             { time: 1395896610,
               distinct_id: 'b53293da8304e965c3d63a7b5bc7f0d4' } },
          { properties:
             { time: 1395896611,
               distinct_id: '99766c220b35770d8fbe03f79cf326a7' } }
        ];
        t.deepEqual(results, expected, 'should get right rows');
        t.end();
      });
  });
