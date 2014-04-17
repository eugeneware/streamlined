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

### Produce marketing funnel statistics

Given the path of a user ID, and the path of the 'Event' that you wish to report
on, and an array of the 'Events' that you want to report on for your funnel,
using the `#funnel` stream will generate a report of how many user went through
every stage of the funnel:

``` js
var sl = require('streamlined'),
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
