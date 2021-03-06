var redtape = require('redtape'),
    fs = require('fs'),
    path = require('path'),
    JSONStream = require('JSONStream'),
    bl = require('bl'),
    d = require('defunct'),
    sl = require('..'),
    concat = require('concat-stream'),
    crypto = require('crypto');

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

it('should be able to count distinct properties', 1, function(t, events) {
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

it('should be able to pluck out an object with a locator', 1,
  function(t, events) {
    var results = [];
    events
      .pipe(sl.missing('properties.$browser'))
      .pipe(sl.pluck('properties'))
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        var expected = [
          { time: 1395773040,
            distinct_id: '7eab3f90d1d3164608293f3d38759e4e',
            campaign_id: 146099,
            delivery_id: 90516639,
            message_id: 51683,
            message_type: 'email' },
          { time: 1395773053,
            distinct_id: '7eab3f90d1d3164608293f3d38759e4e',
            campaign_id: 146099,
            type: 'email' }
        ];
        t.deepEqual(results, expected, 'should just get the properties');
        t.end();
      });
  });

it('should be able to use a where clause (selector, needle)', 13,
  function(t, events) {
    var count = 0;
    events
      .pipe(sl.limit(50))
      .pipe(sl.where('properties.$browser', 'Chrome'))
      .on('data', function (data) {
        t.equal(data.properties.$browser, 'Chrome');
        count++;
      })
      .on('end', function () {
        t.equal(count, 12, 'only 12 events');
        t.end();
      });
  });

it('should be able to use a where clause mongodb/jsonquery syntax', 13,
  function(t, events) {
    var count = 0;
    events
      .pipe(sl.limit(50))
      .pipe(sl.where({ 'properties.$browser': 'Chrome' }))
      .on('data', function (data) {
        t.equal(data.properties.$browser, 'Chrome');
        count++;
      })
      .on('end', function () {
        t.equal(count, 12, 'only 12 events');
        t.end();
      });
  });

it('should be able to use a where clause with a function predicate', 13,
  function(t, events) {
    var count = 0;
    events
      .pipe(sl.limit(50))
      .pipe(sl.where(function (data) {
        return data.properties.$browser === 'Chrome';
      }))
      .on('data', function (data) {
        t.equal(data.properties.$browser, 'Chrome');
        count++;
      })
      .on('end', function () {
        t.equal(count, 12, 'only 12 events');
        t.end();
      });
  });

it('should be able to map over a stream', 1, function(t, events) {
  function md5(data) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(data);
    return md5sum.digest('hex');
  }

  function md5browser(data) {
    data.properties.$browser = md5(data.properties.$browser);
    return data;
  }

  var results = [];
  events
    .pipe(sl.tail(5))
    .pipe(sl.map(md5browser))
    .pipe(sl.pluck('properties.$browser'))
    .on('data', function (data) {
      results.push(data);
    })
    .on('end', function () {
      var expected = [
        '986c37480b1f1c2e443504b38b6361b4',
        '986c37480b1f1c2e443504b38b6361b4',
        '986c37480b1f1c2e443504b38b6361b4',
        'b4540da93e13d1326d68d2258e45446e',
        '986c37480b1f1c2e443504b38b6361b4'
      ];
      t.deepEqual(results, expected, 'browser hashes correct');
      t.end();
    });
});

it('should be able to get called for each data event on a stream', 1,
  function(t, events) {
    var results = [];

    function acc(data) {
      results.push(data);
    }

    events
      .pipe(sl.tail(5))
      .pipe(sl.pluck('properties.distinct_id'))
      .pipe(sl.data(acc, function() {
        var expected = [
          '9f4533ce876717bc49b11fcb02015483',
          '9f4533ce876717bc49b11fcb02015483',
          '99766c220b35770d8fbe03f79cf326a7',
          'b53293da8304e965c3d63a7b5bc7f0d4',
          '99766c220b35770d8fbe03f79cf326a7' ];
        t.deepEqual(results, expected, 'accumulator worked');
        t.end();
      }));
  });

it('should be able to collect all the objects in a stream', 1,
  function(t, events) {
    events
      .pipe(sl.tail(5))
      .pipe(sl.pluck('properties.distinct_id'))
      .pipe(sl.collect(function(err, results) {
        var expected = [
          '9f4533ce876717bc49b11fcb02015483',
          '9f4533ce876717bc49b11fcb02015483',
          '99766c220b35770d8fbe03f79cf326a7',
          'b53293da8304e965c3d63a7b5bc7f0d4',
          '99766c220b35770d8fbe03f79cf326a7' ];
        t.deepEqual(results, expected, 'collection worked');
        t.end();
      }));
  });

it('should be able to apply multiple maps over a stream', 1,
  function(t, events) {
    function md5(data) {
      var md5sum = crypto.createHash('md5');
      md5sum.update(data);
      return md5sum.digest('hex');
    }

    function md5browser(data) {
      data.properties.$browser = md5(data.properties.$browser);
      return data;
    }

    function truncate(n) {
      return function (data) {
        data.properties.$browser = data.properties.$browser.substr(0, n);
        return data;
      };
    };

    var results = [];
    events
      .pipe(sl.tail(5))
      .pipe(sl.map(md5browser, truncate(8)))
      .pipe(sl.pluck('properties.$browser'))
      .on('data', function (data) {
        results.push(data);
      })
      .on('end', function () {
        var expected = [
          '986c3748',
          '986c3748',
          '986c3748',
          'b4540da9',
          '986c3748',
        ];
        t.deepEqual(results, expected, 'truncated browser hashes correct');
        t.end();
      });
  });

it('should be able to produce a marketing funnel', 1, function(t, events) {
  events
    .pipe(sl.funnel('properties.distinct_id', 'event',
      ['Viewed Sales Page', 'Clicked Add To Cart', 'Viewed Beta Invite', 'Submitted Beta Survey']))
    .on('data', function (data) {
      var expected = {
        'Viewed Sales Page': 399,
        'Clicked Add To Cart': 36,
        'Viewed Beta Invite': 36,
        'Submitted Beta Survey': 28 };
      t.deepEqual(data, expected, 'Correct funnel results');
    })
    .on('end', function () {
      t.end();
    });
});

it('should be able to aggregate over items (single)', 1, function(t, events) {
  function sum(selectorExpr) {
    var locator = d.selector(selectorExpr);
    return function (acc, data) {
      acc = acc || 0;
      var val = locator(data);
      if (typeof val === 'number') {
        acc += val;
      }
      return acc;
    };
  }

  events
    .pipe(sl.aggregate('properties.$initial_referring_domain', sum('properties.time')))
    .on('data', function (data) {
      var expected = {
        '$direct': 2465011296034,
        'www.something.com': 8374730552,
        'mail.qq.com': 18145722876,
        'cwebmail.mail.163.com': 2791450358,
        'm.email.seznam.cz': 4187199003,
        undefined: 2791546093,
        'm.facebook.com': 2791563670,
        'www.google.co.uk': 2791596886,
        'nm20.abv.bg': 2791603002,
        'www.google.com': 18146059483,
        'webmailb.netzero.net': 13958396912,
        'webmail.kitchenrefacers.ca': 4187590206,
        'www.ekit.com': 2791762707,
        'webmail.myway.com': 13958909358,
        'poczta.wp.pl': 2791781736 };
      t.deepEqual(data, expected, 'correct sum');
    })
    .on('end', function () {
      t.end();
    });
});

it('should be able to aggregate over items (multiple)', 1, function(t, events) {
  function sum(selectorExpr) {
    var locator = d.selector(selectorExpr);
    return function (acc, data) {
      acc = acc || 0;
      var val = locator(data);
      if (typeof val === 'number') {
        acc += val;
      }
      return acc;
    };
  }

  function max(selectorExpr) {
    var locator = d.selector(selectorExpr);
    return function (acc, data) {
      var val = locator(data);
      if (typeof val === 'number') {
        acc = acc || val;
        acc = Math.max(acc, val);
      }
      return acc;
    };
  }

  events
    .pipe(sl.aggregate('properties.$initial_referring_domain', {
      sum: sum('properties.time'),
      max: max('properties.time')
    }))
    .on('data', function (data) {
      var expected = {
        '$direct': { sum: 2465011296034, max: 1395896611 },
         'www.something.com': { sum: 8374730552, max: 1395871232 },
         'mail.qq.com': { sum: 18145722876, max: 1395893241 },
         'cwebmail.mail.163.com': { sum: 2791450358, max: 1395725179 },
         'm.email.seznam.cz': { sum: 4187199003, max: 1395733001 },
         undefined: { sum: 2791546093, max: 1395773053 },
         'm.facebook.com': { sum: 2791563670, max: 1395781835 },
         'www.google.co.uk': { sum: 2791596886, max: 1395798443 },
         'nm20.abv.bg': { sum: 2791603002, max: 1395801501 },
         'www.google.com': { sum: 18146059483, max: 1395895873 },
         'webmailb.netzero.net': { sum: 13958396912, max: 1395839884 },
         'webmail.kitchenrefacers.ca': { sum: 4187590206, max: 1395863906 },
         'www.ekit.com': { sum: 2791762707, max: 1395881354 },
         'webmail.myway.com': { sum: 13958909358, max: 1395891210 },
         'poczta.wp.pl': { sum: 2791781736, max: 1395890868 } };
      t.deepEqual(data, expected, 'correct sum and max');
    })
    .on('end', function () {
      t.end();
    });

  it('should be able to aggregate and keep non-matching items', 1,
    function(t, events) {
      function funnel(userSelector, events) {
        var userLocator = d.selector(userSelector);
        var users = {}
        return function (acc, data, evt) {
          var userId = userLocator(data);
          users[userId] = users[userId] || 0;
          var funnelEvent = events.indexOf(evt);

          if (funnelEvent !== -1) {
            // if event is in right order then increment stats
            if (funnelEvent === users[userId]) {
              acc = acc || 0;
              users[userId] = funnelEvent + 1;
              acc++;
            }
          }

          return acc;
        }
      }

      events
        .pipe(sl.aggregate('event', funnel('properties.distinct_id',
          ['Viewed Sales Page',
           'Clicked Add To Cart',
           'Viewed Beta Invite',
           'Submitted Beta Survey'])))
        .on('data', function (data) {
          var expected = {
            'Viewed Sales Page': 399,
            'Viewed Page': undefined,
            'Clicked Add To Cart': 36,
            'Viewed Beta Invite': 36,
            'Clicked Joined Beta': undefined,
            'Viewed Beta Survey': undefined,
            'Beta Signup Success': undefined,
            'Submitted Beta Survey': 28,
            '$campaign_delivery': undefined,
            '$campaign_open': undefined,
            'Something Login': undefined,
            'Something Create New Script': undefined,
            'Something Script Step': undefined,
            'Something Script Review': undefined,
            'Something Script Copied': undefined,
            'Something Completed Script': undefined,
            'Something Set Password': undefined };
          t.deepEqual(data, expected, 'should have undefined');
        })
        .on('end', function () {
          t.end();
        });
    });

  it('should be able to aggregate and drop non-matching items', 1,
    function(t, events) {
      function funnel(userSelector, events) {
        var userLocator = d.selector(userSelector);
        var users = {}
        return function (acc, data, evt) {
          var userId = userLocator(data);
          users[userId] = users[userId] || 0;
          var funnelEvent = events.indexOf(evt);

          if (funnelEvent !== -1) {
            acc = acc || 0;
            // if event is in right order then increment stats
            if (funnelEvent === users[userId]) {
              users[userId] = funnelEvent + 1;
              acc++;
            }
          }

          return acc;
        }
      }

      events
        .pipe(sl.aggregate('event',
          funnel('properties.distinct_id',
                  ['Viewed Sales Page',
                   'Clicked Add To Cart',
                   'Viewed Beta Invite',
                   'Submitted Beta Survey']), true))
        .on('data', function (data) {
          var expected = {
            'Viewed Sales Page': 399,
            'Clicked Add To Cart': 36,
            'Viewed Beta Invite': 36,
            'Submitted Beta Survey': 28 };
          t.deepEqual(data, expected, 'should not have undefineds');
        })
        .on('end', function () {
          t.end();
        });
    });
});

it.only('should be able to stringify an object stream', 1, function(t, events) {
  events
    .pipe(sl.limit(3))
    .pipe(sl.stringify()).pipe(concat(function (data) {
      var expected = [
        '{"event":"Viewed Sales Page","properties":{"time":1395714685,"distinct_id":"7eab3f90d1d3164608293f3d38759e4e","$browser":"Safari","$city":"Malvern","$initial_referrer":"$direct","$initial_referring_domain":"$direct","$os":"Mac OS X","$region":"Victoria","first_wp_contact":"2014-03-24T17:00:00","first_wp_page":"","first_wp_url":"/","mp_country_code":"AU","mp_lib":"web","utm_content":"762","utm_medium":"email","utm_source":"vid-marketing2","utm_campaign":"Something Marketing Launch 2"}}',
        '{"event":"Viewed Page","properties":{"time":1395714685,"distinct_id":"7eab3f90d1d3164608293f3d38759e4e","$browser":"Safari","$city":"Malvern","$initial_referrer":"$direct","$initial_referring_domain":"$direct","$os":"Mac OS X","$region":"Victoria","first_wp_contact":"2014-03-24T17:00:00","first_wp_page":"","first_wp_url":"/","mp_country_code":"AU","mp_lib":"web","page name":"","page url":"/","utm_content":"762","utm_medium":"email","utm_source":"vid-marketing2","utm_campaign":"Something Marketing Launch 2"}}',
        '{"event":"Clicked Add To Cart","properties":{"time":1395714747,"distinct_id":"7eab3f90d1d3164608293f3d38759e4e","$browser":"Safari","$city":"Malvern","$initial_referrer":"$direct","$initial_referring_domain":"$direct","$os":"Mac OS X","$region":"Victoria","first_wp_contact":"2014-03-24T17:00:00","first_wp_page":"","first_wp_url":"/","mp_country_code":"AU","mp_lib":"web","utm_content":"762","utm_medium":"email","utm_source":"vid-marketing2","url":"http://noblesamurai.com/c/subscribe-to-something-launch-3","utm_campaign":"Something Marketing Launch 2"}}',
        ''].join('\n');
    t.equal(expected, data);
    t.end();
  }));
});
