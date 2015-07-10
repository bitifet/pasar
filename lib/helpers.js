// PASAR - helpers.js
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
var Cfg = require("../cfg.js");
module.exports = {
    sendStatusMessage: function sendStatusMessage(res, stName, msg) {//{{{
        var st = Cfg.statIdx[stName];
        if (st === undefined) {
            return res.status(Cfg.statIdx.error).send("Internal Server Error");
        } else {
            return res.status(st).send(msg);
        };
    },//}}}
};
