// PASAR - lib/defaultRequestMapper.js
// =========================================
// (Promise Aware Smart API Rest) generator.
//
// Tool to easily build Express-like routers with an Smart API REST facilites
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
"use strict";

var Url = require('url');
var Util = require("./util.js");

module.exports = function defaultRequestMapper ( // Overridable thought "requestMapper".
    req,    // HTTP Request object. (Express)
    method  // Actual method name.
) {

    // Map ":paramName" as is.
    var params = {};
    if (
        typeof req.params == "object"
    ) for (
        var prmName in req.params
    ) params[":"+prmName] = req.params[prmName];

    // Input for our API function handler.
    return Util.oExtend([
        params
        , Url.parse(req.url, true).query    // GET
        , req.body                          // POST (Requires body-parser: https://www.npmjs.com/package/body-parser)
    ]);
};
