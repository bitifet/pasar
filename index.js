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
var Util = require("./util.js");
var OutputFormatters = require("./formatters.js");
var Cfg = require("./cfg.js");

var Tpl = {
    helpIndex: Util.tpl("helpIndex.jade"),
    helpItem: Util.tpl("helpItem.jade"),
};

function defaultRequestMapper ( // Overridable thought "requestMapper". //{{{
    req,    // HTTP Request object. (Express)
    method  // Actual method name.
) {
    // Input for our API function handler.
    return req.body;
};//}}}

function defaultResponseMapper ( // Overridable thought "responseMapper". //{{{
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
};//}}}

var defaultAuthHandler = (function(){//{{{
    var defOutputFilter = function(input){return input;}; // No filtering peformed by default.
    var defCheckPrivileges = function(){return {};};
    return function defaultAuthHandler (
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
})();//}}}

var outputFilters = (//{{{
    function (src) { // Wrap common input checkins wrapping:
        var flt = {};
        Object.keys(src).map(function wrapFixations(fltName) {
            flt[fltName] = function(input) {
                var output = {};
                if (input !== undefined) {
                    if (input.data === undefined) {
                        // Accept result without data/metadata separation when
                        // there is no metadata to pass thought.
                        // (Only if no data vector present)
                        output.data = input;
                    } else {
                        output = input;
                    };
                    if (output.meta === undefined) output.meta = {};
                };
                return src[fltName](output);
            };
        });
        return flt;
    }
)(OutputFormatters);//}}}


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
                R.fn[fName][method] = buildFunction(handler, outputFilters[Cfg.defaultOutputFilter]);
                R.syncFn[fName][method] = Util.depromise(R.fn[fName][method]);

                // For all available filters:
                if (! Prefs.noFilters) for (var ext in outputFilters) {
                    if (R.fn[fName+"."+ext] === undefined) {
                        R.fn[fName+"."+ext] = {};
                        R.syncFn[fName+"."+ext] = {};
                    };
                    R.fn[fName+"."+ext][method] = buildFunction(handler, outputFilters[ext]);
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

            // Pick appropriate request and response mappers://{{{

            var requestMapper = defaultRequestMapper;   // Default.
            var responseMapper = defaultResponseMapper; // Default.
            var authHandler = defaultAuthHandler;       // Default.

            if (spc.requestMapper !== undefined) {
                if (spc.requestMapper[method] !== undefined) {
                    requestMapper = spc.requestMapper[method];
                } else if (spc.requestMapper.all !== undefined) {
                    requestMapper = spc.requestMapper.all;
                };
            };

            if (spc.responseMapper !== undefined) {
                if (spc.responseMapper[method] !== undefined) {
                    responseMapper = spc.responseMapper[method];
                } else if (spc.responseMapper.all !== undefined) {
                    responseMapper = spc.responseMapper.all;
                };
            };
            
            if (spc.authHandler !== undefined) {
                if (spc.authHandler[method] !== undefined) {
                    authHandler = spc.authHandler[method];
                } else if (spc.authHandler.all !== undefined) {
                    authHandler = spc.authHandler.all;
                };
            };

            //}}}

            // Append main route://{{{
            Util.buildHandler(
                R
                , rtPath
                , method
                , rtHandler
                , requestMapper
                , responseMapper
                , outputFilters[Cfg.defaultOutputFilter]
                , authHandler
            );
            //}}}

            // Append routes for all available output filters://{{{
            if (! Prefs.noFilters) for (var ext in outputFilters) {
                Util.buildHandler(
                    R
                    , rtPath + "." + ext
                    , method
                    , rtHandler
                    , requestMapper
                    , responseMapper
                    , outputFilters[ext]
                    , authHandler
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

