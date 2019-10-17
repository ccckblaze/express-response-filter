# Express Response Filter Middleware [![NPM version](https://badge.fury.io/js/express-response-filter.png)](http://badge.fury.io/js/express-response-filter)

This Express Middleware will allow you to send a subset of a JSON object
instead of an entire object from your HTTP services. To do so, your services
will begin accepting the `?fields=` query-string that, using a simple language,
will specify which fields and sub-feelds to keep and which to ignore.

If you've used the Google APIs, provided a `?fields=` query-string to get a
[Partial Response](https://developers.google.com/+/api/#partial-responses),
and wanted to do the same for your own server, now you can do so with this
middleware.

*Underneath, this middleware uses [json-mask](https://github.com/nemtsov/json-mask).
Use it directly without this middleware if you need more flexibility.*

# Installation

```
npm install express-response-filter --save
```

# Usage

```js
var express = require('express')
  , responseFilter = require('express-response-filter')
  , app = express()

app.use(responseFilter())

app.get('/', function (req, res, next) {
  // keyword filter, not influenced by user query input
  req.filters = ["id", "password", "token"];

  res.json({
      firstName: 'Mohandas'
    , lastName: 'Gandhi'
    , aliases: [{
          firstName: 'Mahatma'
        , lastName: 'Gandhi'
      }, {
          firstName: 'Bapu'
      }]
  })
})

app.listen(4000)
```

Let's test it:

```
$ curl 'http://localhost:4000'
{"firstName":"Mohandas","lastName":"Gandhi","aliases":[{"firstName":"Mahatma","lastName":"Gandhi"},{"firstName":"Bapu"}]}

$ # Let's just get the first name
$ curl 'http://localhost:4000?fields=lastName'
{"lastName":"Gandhi"}

$ # Now, let's just get the first names directly as well as from aliases
$ curl 'http://localhost:4000?fields=firstName,aliases(firstName)'
{"firstName":"Mohandas","aliases":[{"firstName":"Mahatma"},{"firstName":"Bapu"}]}
```

**Note:** take a look at `/example`.

# Syntax

Look at [json-mask](https://github.com/nemtsov/json-mask) for the available syntax of the `fields` param.

# Options

`query` specifies the query-string to use. Defaults to `fields`
`prefix` specifies the query-string prefix.

```js
app.use(responseFilter({
  query: 'filter'
}))
```

# License

MIT. See LICENSE

# Reference To https://github.com/nemtsov/express-partial-response/
