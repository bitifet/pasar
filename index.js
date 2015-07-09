// PASAR - index.js
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
var Path = require("path");
var Express = require("express");
var Util = require("./lib/util.js");
var Cfg = require("./cfg.js");

var Tpl = {
    helpIndex: Util.tpl("helpIndex.jade"),
    helpItem: Util.tpl("helpItem.jade"),
};

var defaultRequestMapper = require("./lib/defaultRequestMapper.js");
var defaultResponseMapper = require("./lib/defaultResponseMapper.js");
var Auth = require("./lib/auth.js");

var exportFilters = require("./lib/formatters.js");

function functionDuck(duck) {
    return typeof duck == "function";
};

module.exports = function APIloader(api, Options) { //{{{

    // Create new router:
    var R = Express.Router();
    
    var Prefs = Util.buildPrefs(Options);

    // Attach Promise Engine:
    if (Prefs.promiseEngine) {
        R.Promise = Prefs.promiseEngine;
    } else if (! R.Promise) {
        R.Promise = require('promise');
    };
    
    var Tools = {
        exposeCallable: (function(){//{{{

            function buildFunction (handler, filter) {//{{{
                return function (input) {
                    return new R.Promise(function(resolve, reject){
                        handler.call(this, input)
                            .then(function(result){
                                resolve(filter(result));
                            })
                            .catch(reject)
                        ;
                    });
                };
            };//}}}

            return function buildCallable(fName, handler, method, Prefs){ // Expose handler as callable function://{{{

                if (R.fn === undefined) {
                    R.fn = {};
                    R.syncFn = {};
                };

                // With default output filter:
                if (R.fn[fName] === undefined) {
                    R.fn[fName] = {};
                    R.syncFn[fName] = {};
                };
                R.fn[fName][method] = buildFunction(handler, exportFilters[Cfg.defaultOutputFilter]);
                R.syncFn[fName][method] = Util.depromise(R.fn[fName][method]);

                // For all available filters:
                if (! Prefs.noFilters) for (var ext in exportFilters) {
                    if (R.fn[fName+"."+ext] === undefined) {
                        R.fn[fName+"."+ext] = {};
                        R.syncFn[fName+"."+ext] = {};
                    };
                    R.fn[fName+"."+ext][method] = buildFunction(handler, exportFilters[ext]);
                    R.syncFn[fName+"."+ext][method] = Util.depromise(R.fn[fName+"."+ext][method]);
                };

            }; //}}}

        })(),//}}}
    };


    // Populate all specified routes:
    for (var rtPath in api) {
        var fName = rtPath.replace("/", "_"); // Exposed function name.
        var spc = api[rtPath];               // Function full specification.
        rtPath = "/" + rtPath;               // Route base path.

        // Build help item route://{{{
        if (! Prefs.noHelp) {
            spc.help = Util.hlpAutocomplete(spc, rtPath, Prefs);
            (function (hlp) {
                R.get(rtPath + "/help", function renderHelpItem(req, res, next) {
                    res.header("Content-Type", "text/html");
                    res.send(Tpl.helpItem(hlp));
                });
            })(spc.help);
        };//}}}

        Cfg.validMethods.map(function(method){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + method];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

            if (! Prefs.noLib) Tools.exposeCallable (fName, rtHandler, method, Prefs);

            var requestMapper = Util.pick([//{{{
                [spc.requestMapper, method],
                [spc.requestMapper, "all"],
                [spc.requestMapper],
                [Prefs.defaults, "requestMapper."+method],
                [Prefs.defaults, "requestMapper.all"],
                [Prefs.defaults, "requestMapper"],
                [defaultRequestMapper] // Default.
            ], functionDuck);//}}}

            var responseMapper = Util.pick([//{{{
                [spc.responseMapper, method],
                [spc.responseMapper, "all"],
                [spc.responseMapper],
                [Prefs.defaults, "responseMapper."+method],
                [Prefs.defaults, "responseMapper.all"],
                [Prefs.defaults, "responseMapper"],
                [defaultResponseMapper] // Default.
            ], functionDuck);//}}}
            
            var authHandler = Util.pick([//{{{
                [spc.authHandler, method],
                [spc.authHandler, "all"],
                [spc.authHandler],
                [Prefs.defaults, "authHandler."+method],
                [Prefs.defaults, "authHandler.all"],
                [Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], functionDuck);//}}}


            // Append main route://{{{
            Util.buildHandler(
                R
                , rtPath
                , null
                , method
                , rtHandler
                , requestMapper
                , responseMapper
                , authHandler
                , spc.ac
            );
            //}}}

            // Append routes for all available output filters://{{{
            if (! Prefs.noFilters) for (var ext in exportFilters) {
                Util.buildHandler(
                    R
                    , rtPath
                    , ext
                    , method
                    , rtHandler
                    , requestMapper
                    , responseMapper
                    , authHandler
                    , spc.ac
                );
            };//}}}

        });

    };

    // Build help index route://{{{
    if (! Prefs.noHelp) R.get("/help", function renderHelpIndex(req, res, next) {
        res.header("Content-Type", "text/html");
        res.send(Tpl.helpIndex({
            path: Path.dirname(req.uri.pathname),
            prefs: Prefs.client,
            fn: Object.keys(api).map(function(rtPath){return api[rtPath].help;}),
        }));
    });//}}}

    // Shorthand for single-method functions://{{{
    if (! Prefs.noLib) Object.keys(R.fn).filter(function(k){
        var methods = Object.keys(R.fn[k]);
        if ( // Function has only one (get/post/.../all) method.
            methods.length === 1
        ) { // Let to access it directly as R.fn[fName]() without ".get", ".post", etc..
            var mtd = methods[0];
            var asyncFn = R.fn[k][mtd];
            var syncFn = R.syncFn[k][mtd];
            R.fn[k] = asyncFn;
            R.fn[k][mtd] = asyncFn;
            R.syncFn[k] = syncFn;
            R.syncFn[k][mtd] = syncFn;
        };
    });//}}}


    // Do some cleanup:
    for (var i in Tools) delete Tools[i];

    return R;
};//}}}

