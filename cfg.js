// PASAR - cfg.js
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
module.exports = {
    corePromiseEngine: "bluebird",
    defaultOutputFilter: "json",
    defaultTimeoutMessage: "Timeout!",
    defaultLogErrors: true,
    tplBriefLenght: 400,
    validMethods: ['get', 'post', 'put', 'delete', 'patch', 'all'],
    statIdx: {
        ok: 200,
        forbidden: 403,
        notFound: 404,
        error: 500,
    },
};
