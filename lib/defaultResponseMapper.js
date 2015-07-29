// PASAR - lib/defaultResponseMapper.js
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
var Util = require("./util.js");

module.exports = function defaultResponseMapper ( // Overridable thought "responseMapper".
    p,              // Result promise returned from our API function handler.
    outputFilter,   // Formatting filter to be applyed.
    res,            // HTTP Response object. (Express)
    next            // HTTP Next() function. (Express)
) {
    p.then(function(data){
        var result = outputFilter(data);
        res.header("Content-Type", result.ctype);
        res.send(result.data);
    })
    .catch(function(err){
        Util.sendStatusMessage(res, 'error', err.toString());
    });
};
