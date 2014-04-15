# streamlined

Collection of helper streams to deal with mapping/transforming object streams

[![build status](https://secure.travis-ci.org/eugeneware/streamlined.png)](http://travis-ci.org/eugeneware/streamlined)

## Installation

This module is installed via npm:

``` bash
$ npm install streamlined
```

## Example Usage

``` js
var sl = require('streamlined');
db.createReadStream()
  //.pipe(sl.distinct(['properties', '$browser']))
  //.pipe(sl.distinct(['properties', 'mp_country_code']))
  //.pipe(sl.distinct(['event']))
  //.pipe(sl.distinct(['properties', 'distinct_id'], false))
  //.pipe(sl.missing(['properties', '$browser']))
  //.pipe(sl.count())
  //.pipe(sl.select([['value', 'properties', 'time'], ['value', 'properties', 'distinct_id']]))
  .pipe(sl.where(['properties', 'distinct_id'], 'eugene@noblesamurai.com'))
  .pipe(sl.select([['properties', 'time'], ['event'], ['properties', 'distinct_id']]))
  .on('data', console.log);
```
