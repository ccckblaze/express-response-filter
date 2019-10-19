const jsonMask = require('json-mask');
const eachDeep = require('deepdash/eachDeep');

const badCode = code => code >= 300 || code < 200

module.exports = function (opt) {
  opt = opt || {}

  function isObject(obj) {
    return obj != null && obj.constructor === Object;
  }

  function partialResponse(obj, req) {
    // use filters to restrict result
    let filters = [];
    if (Array.isArray(req.customFilter)) {
      filters = filters.concat(req.customFilter);
    }
    if (Array.isArray(opt.filter)) {
      filters = filters.concat(opt.filter);
    } else if ('function' === typeof opt.filter) {
      obj = opt.filter(obj);
    }

    // filter by array
    if (filters.length) {
      let breakLoop = false;
      obj = eachDeep(obj, (value, key, parent, ctx) => {
        if (ctx.isCircular || breakLoop) {
          return false;
        }
        
        if(ctx.depth > 10){
          console.error("filters failed, too much depth of ctx", ctx);
          breakLoop = true;
        }

        //do removal
        if (filters.indexOf(key) !== -1) {
          if (isObject(parent)) {
            delete parent[key]
          }
          else if (Array.isArray(parent)) {
            parent.splice(key, 1);
          }
        }
      }, {
        checkCircular: true,
        keepCircular: false
      })
    }

    // get fields key
    const fieldsKey = opt.query || 'fields';
    const fields = req[fieldsKey];

    if (fields) {
      const fieldPrefix = opt.prefix || '';
      obj = jsonMask(obj, fieldPrefix + fields);
    }

    return obj;
  }

  function wrap(orig) {
    return function (obj) {
      const req = this.req;
      if (1 === arguments.length) {
        if (badCode(this.statusCode)) {
          return orig(this.statusCode, arguments[0]);
        } else {
          return orig(partialResponse(obj, req));
        }
      }

      if ('number' === typeof arguments[1] && !badCode(arguments[1])) {
        // res.json(body, status) backwards compat
        return orig(partialResponse(obj, req), arguments[1]);
      }

      if ('number' === typeof obj && !badCode(obj)) {
        // res.json(status, body) backwards compat
        return orig(obj, partialResponse(arguments[1], req));
      }

      // The original actually returns this.send(body)
      return orig(obj, arguments[1]);
    }
  }

  return function (req, res, next) {
    if (!res.__isJSONMaskWrapped) {
      // get fields key
      const fieldsKey = opt.query || 'fields';
      // move query to fields
      req[fieldsKey] = req.query[fieldsKey];
      delete req.query[fieldsKey];

      res.json = wrap(res.json.bind(res))
      if (req.jsonp) res.jsonp = wrap(res.jsonp.bind(res))
      res.__isJSONMaskWrapped = true
    }
    next()
  }
}