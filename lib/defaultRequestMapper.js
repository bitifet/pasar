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

module.exports = function defaultRequestMapper ( // Overridable thought "requestMapper".
    req,    // HTTP Request object. (Express)
    method  // Actual method name.
) {
    // Input for our API function handler.
    return req.body;
};
