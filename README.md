# streamlined

Collection of helper streams to deal with mapping/transforming object streams

[![build status](https://secure.travis-ci.org/eugeneware/streamlined.png)](http://travis-ci.org/eugeneware/streamlined)

## Installation

This module is installed via npm:

``` bash
$ npm install streamlined
```

## Example Usage

### Limit the number of events emitted by a stream

Use `#limit()` or `#head()` to limit the number of data events emitted to the
first 5:

``` js
var sl = require('streamlined');
var count = 0;
myObjectModeStream()
  .pipe(sl.limit(5))
  .on('data', function (data) {
    // should only print the first 5 data events
    console.log(data);
  });
```

### Transform an object stream to a { key: key, data: data } stream

Useful to writing to [leveldb](https://github.com/rvagg/node-levelup).

Provide the path of the key as the first arg of the `#key` function, and it
will be made the `key` field, and the body of the data event will be made the
`value` field:

``` js
var sl = require('streamlined');
myObjectModeStream()
  .pipe(sl.key('properties.time')
  .on('data', function (data) {
    // `data` will look like { key: properties.time, value: originalData }
  });
```

### Count the number of objects in a stream

Counts the number of objects in a stream with `#count`:

``` js
var sl = require('streamlined');
myObjectModeStream()
  .pipe(sl.count())
  .on('data', function (data) {
    console.log(data);
    // prints: { count: 1838 }
  })
```

### Limit the number of objects by bytes (once JSON stringified)

Keeps track of the total byte size of the objects flowing through based on the
JSON stringified size. Doesn't include crlf or surrounding array characters,
however:

``` js
var sl = require('streamlined'),
    JSONStream = require('JSONStream'),
    fs = require('fs');
myObjectModeStream()
  .pipe(sl.limitBytes(1024))
  .pipe(JSONStream.stringify('', '', ''))
  // output.json won't be bigger than 1024 bytes
  .pipe(fs.createWriteStream('output.json'));
```

### Show the last n items in an object stream

Uses the `#tail` function to only return the last n items in an objects stream:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.tail(5))
  .on('data', function (data) {
    // should only print the last 5 data events
    console.log(data);
  });
```

### Count the different distinct values an object property can take

Say you have a stream of web log events, and want to count how many users
use different web browsers. You can use the `#distinct` function and pass it
the path of the browser property, and get the answer!:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.distinct('properties.$browser'))
  .on('data', function (data) {
    // data should be:
    /***
     * data should be:
        {
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
    */
  })
```

### Return objects that don't contain a field

Use the `#missing` stream to only show objects that don't contain a field,
given a path to the field:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.missing('properties.$browser'))
  .on('data', function (data) {
    // only events that are missing the `properties.$browser` field will be
    // printed
    console.log('data');
  })
```

### Select specific fields to be shown (like SQL select)

Given an array of object paths, retrieve those fields and return them as
an array of values as a 'row':

``` js
var sl = require('streamlined'),
myObjectModeStream()
var results = [];
events
  .pipe(sl.tail(5))
  .pipe(sl.select(['properties.time', 'properties.distinct_id']))
  .on('data', function (data) {
    console.log(data);
  });
  /***
   * will print out the 5 rows, the first row is a timestamp,
   * the second row is the user Id:
      [ 1395896604, '9f4533ce876717bc49b11fcb02015483' ]
      [ 1395896604, '9f4533ce876717bc49b11fcb02015483' ]
      [ 1395896610, '99766c220b35770d8fbe03f79cf326a7' ]
      [ 1395896610, 'b53293da8304e965c3d63a7b5bc7f0d4' ]
      [ 1395896611, '99766c220b35770d8fbe03f79cf326a7' ]
   */
```

You can also choose to return those items as an object, where the paths used
to locate the fields will be used to contruct a minimal object with those
selected values, just pass through `true` as the last field in `#select`:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.tail(5))
  .pipe(sl.select(['properties.time', 'properties.distinct_id'], true))
  .on('data', function (data) {
    console.log(data);
  });
  /***
   * will print out the 5 rows:
      { properties:
         { time: 1395896604,
           distinct_id: '9f4533ce876717bc49b11fcb02015483' } }
      { properties:
         { time: 1395896604,
           distinct_id: '9f4533ce876717bc49b11fcb02015483' } }
      { properties:
         { time: 1395896610,
           distinct_id: '99766c220b35770d8fbe03f79cf326a7' } }
      { properties:
         { time: 1395896610,
           distinct_id: 'b53293da8304e965c3d63a7b5bc7f0d4' } }
      { properties:
         { time: 1395896611,
           distinct_id: '99766c220b35770d8fbe03f79cf326a7' } }
   */
```

### Pluck out a field or child object by a locator

Often you just want to select a single field from an object, or get a
sub-object by supplying a path to the field. Use `#pluck` with a path locator:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.pluck('properties'))
  .on('data', function (data) {
    console.log(data);
  })
  /***
   *  Will print out the child objects under the `properties` field:
      { time: 1395773040,
        distinct_id: '7eab3f90d1d3164608293f3d38759e4e',
        campaign_id: 146099,
        delivery_id: 90516639,
        message_id: 51683,
        message_type: 'email' }
      { time: 1395773053,
        distinct_id: '7eab3f90d1d3164608293f3d38759e4e',
        campaign_id: 146099,
        type: 'email' }
  */
```

### Build a simple where clause (like SQL) from a field and value

Often you would like to filter a stream of objects based on the value of
one of the fields. In this case, just supply a field locator, and the value
that you are trying to find to retrict your results using the `#where`
stream:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.where('properties.$browser', 'Chrome'))
  .on('data', function (data) {
    console.log(data.properties.$browser);
    // Should print out: 'Chrome'
  })
```

### Build powerful where clauses using the mongodb query syntax

For more powerful queries you can use the mongodb query syntax (as implemented
by [jsonquery](https://github.com/eugeneware/jsonquery). Just pass a query
object to `#where`:

``` js
var sl = require('streamlined'),
myObjectModeStream()
  .pipe(sl.where({ 'properties.$browser': 'Chrome' }))
  .on('data', function (data) {
    console.log(data.properties.$browser);
    // Should print out: 'Chrome'
  })
```

### Simple mapping over every object in an object stream

Say you want to transform every object in a stream. Simply provide a transform
function to the `#map` stream:

``` js
var sl = require('streamlined'),
    crytpo = require('crypto');

// return an md5 of data
function md5(data) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(data);
  return md5sum.digest('hex');
}

// return the md5 of the properties.$browser field
function md5browser(data) {
  data.properties.$browser = md5(data.properties.$browser);
  return data;
}

myObjectModeStream()
  .pipe(sl.map(md5browser))
  .on('data', function (data) {
    console.log(data.properties.$browser);
  })
  // will print out the md5 of the browser values
  /**
    986c37480b1f1c2e443504b38b6361b4
    986c37480b1f1c2e443504b38b6361b4
    986c37480b1f1c2e443504b38b6361b4
    b4540da93e13d1326d68d2258e45446e
    986c37480b1f1c2e443504b38b6361b4
   */
```

### Simple iterations and processing over every object in an object stream

Say you want to transform every object in a stream. Simply provide a transform
function to the `#map` stream:

Often all you want to do is just iterate and call a function on every item
in a stream:

``` js
var sl = require('streamlined');

myObjectModeStream()
  .pipe(sl.map(md5browser))
  .pipe(sl.data(console.log));

  // will print out the md5 of the browser values
  /**
    986c37480b1f1c2e443504b38b6361b4
    986c37480b1f1c2e443504b38b6361b4
    986c37480b1f1c2e443504b38b6361b4
    b4540da93e13d1326d68d2258e45446e
    986c37480b1f1c2e443504b38b6361b4
   */
```

You can pass a second parameter to `#data` which gets called on the `end` event.

### Collect all the objects in a stream into a single array

Often you want to simply collect all the items in a stream into a single array
for batch processing. You can use `#collect` for this:

``` js
var sl = require('streamlined');

myObjectModeStream()
  .pipe(sl.map(md5browser))
  .pipe(sl.collect(console.log));

  // will print out an array of the md5 of the browser values
  /**
    [ '986c37480b1f1c2e443504b38b6361b4',
      '986c37480b1f1c2e443504b38b6361b4',
      '986c37480b1f1c2e443504b38b6361b4',
      'b4540da93e13d1326d68d2258e45446e',
      '986c37480b1f1c2e443504b38b6361b4' ]
   */
```

You can pass a second parameter to `#data` which gets called on the `end` event.

### Perform Aggregate Calculations

Used in conjunction with some simple aggregating functions (such as those
provided by
[defunct-aggregates](https://github.com/eugeneware/defunct-aggregates), but
you can easily write your own), you can do the object-stream equivalent of
SQL SUMs and COUNTs, and MAX/MINs, here's a SUM:

``` js
var dagg = require('defunct-aggregates'),
    sl = require('streamlined');
myObjectStream()
  .pipe(sl.aggregate('properties.$initial_referring_domain', dagg.sum('properties.time')))
  .on('data', function (data) {
    console.log(data);
    /*
       {
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
        'poczta.wp.pl': 2791781736 }
     */
  });
```

The `#aggregate` function takes two arguments. The first is a locator expression
that will locate the field to GROUP BY. The second is an aggregating function.

The signature of the aggregating function is:

``` js
function (accumulator, data, [columnn name]) {
  // modify the accumulator
  return accumulator;
}
```

To see more about how these are implemented, check out
[defunct-aggregates](https://github.com/eugeneware/defunct-aggregates).

If the second argument is an map of property to functions, then you can do
multiple aggregations:

``` js
var sl = require('streamlined');
myObjectStream()
  .pipe(sl.aggregate('properties.$initial_referring_domain', {
    sum: sum('properties.time'),
    max: max('properties.time')
  }))
  .on('data', function (data) {
    console.log(data);
    /*
     { '$direct': { sum: 2465011296034, max: 1395896611 },
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
    */
```

The last argument to the `#aggregate` function is a boolean which you can use
to ignore undefined results (ie. key values of `undefined`), or whether you
want them there. The default is `false` (show the `undefined`s).

Who needs SQL, right?

### Produce marketing funnel statistics

Given the path of a user ID, and the path of the 'Event' that you wish to report
on, and an array of the 'Events' that you want to report on for your funnel,
using the `#funnel` stream will generate a report of how many user went through
every stage of the funnel:

``` js
var sl = require('streamlined');
myObjectModeStream()
  .pipe(sl.funnel(
    'properties.distinct_id', // path to the user id
    'event',                  // path to the event name
    // list of events to report on for the funnel
    ['Viewed Sales Page', 'Clicked Add To Cart', 'Viewed Beta Invite', 'Submitted Beta Survey']))
  .on('data', function (data) {
    console.log(data);
    /** Prints this report:
      { 'Viewed Sales Page': 399,
        'Clicked Add To Cart': 36,
        'Viewed Beta Invite': 36,
        'Submitted Beta Survey': 28 };
     */
  });
});
```

## Simple Helper Streams

### sl.stringify

Makes it easy to output an object streams as CRLF JSON:

``` js
var sl = require('streamlined');
myObjectModeStream()
  .pipe(sl.stringify())
  .pipe(process.stdout)

// prints each object to stdout JSON.stringified with a new line character
```
