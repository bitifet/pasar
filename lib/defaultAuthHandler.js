// PASAR - lib/defaultAuthHandler.js
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

var defOutputFilter = function(input){return input;}; // No filtering peformed by default.
var defCheckPrivileges = function(){return {};};

module.exports = function defaultAuthHandler (
    method,
    pathSpec,
    req,
    res,
    next
) {
    return {
        filter: defOutputFilter,
        userData: {}, // User data to be provided to each controller.
        privileges: defCheckPrivileges,
    };
};
