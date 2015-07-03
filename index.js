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
var Promise = require("promise");
var Util = require("./util.js");
var OutputFormatters = require("./formatters.js");
var Cfg = require("./cfg.js");

var Tpl = {
    helpIndex: Util.tpl("helpIndex.jade"),
    helpItem: Util.tpl("helpItem.jade"),
};

function defaultRequestMapper (req, method) {//{{{
    return req.body;
};//}}}

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

function buildHandler(//{{{
        router,
        pathSpec,
        method,
        ctrl,
        inputMapper,
        outputMapper
) {
    router[method](pathSpec, function (req,res,next) {
        var p = ctrl(
            inputMapper(req, method)
        ).then(function(data){
            var result = outputMapper(data);
            res.header("Content-Type", result.ctype);
            res.send(result.data);
        })
        .catch(function(err){
            Util.sendStatusMessage(res, 'error', err.toString());
        });
    });
};//}}}

var exposeCallable = (function(){//{{{

    function buildFunction (handler, filter) {//{{{
        return function () {
            return new Promise(function(resolve, reject){
                handler.apply(this, arguments)
                    .then(function(result){
                        resolve(filter(result));
                    })
                    .catch(reject)
                ;
            });
        };
    };//}}}

    return function buildCallable(R, fName, handler, method, Options){ // Expose handler as callable function://{{{

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
        R.syncFn[fName][method] = Util.deasync (R.fn[fName][method]);

        // For all available filters:
        if (! Options.noFilters) for (var ext in outputFilters) {
            if (R.fn[fName+"."+ext] === undefined) {
                R.fn[fName+"."+ext] = {};
                R.syncFn[fName+"."+ext] = {};
            };
            R.fn[fName+"."+ext][method] = buildFunction(handler, outputFilters[ext]);
            R.syncFn[fName+"."+ext][method] = Util.deasync(R.fn[fName+"."+ext][method]);
        };

    }; //}}}


})();//}}}


module.exports = function APIloader(api, Options) { //{{{

    // Create new router:
    var R = Express.Router();
    
    // Sanityze options:
    if (Options === undefined) Options = {};

    // Populate all specified routes:
    for (var rtPath in api) {
        var fName = rtPath.replace("/", "_"); // Exposed function name.
        var spc = api[rtPath];               // Function full specification.
        rtPath = "/" + rtPath;               // Route base path.

        // Build help item route://{{{
        if (! Options.noHelp) {
            spc.help = Util.hlpAutocomplete(spc, rtPath);
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

            if (! Options.noLib) exposeCallable (R, fName, rtHandler, method, Options);

            // Pick appropriate input mapper://{{{
            var inputMapper = defaultRequestMapper;
            if (spc.input !== undefined) {
                if (spc.input[method] !== undefined) {
                    inputMapper = spc.input[method];
                } else if (spc.input.all !== undefined) {
                    inputMapper = spc.input.all;
                };
            };//}}}

            // Append main route://{{{
            buildHandler(
                R,
                rtPath,
                method,
                rtHandler,
                inputMapper,
                outputFilters[Cfg.defaultOutputFilter]
            );
            //}}}

            // Append routes for all available output filters://{{{
            if (! Options.noFilters) for (var ext in outputFilters) {
                buildHandler(
                    R,
                    rtPath + "." + ext,
                    method,
                    rtHandler,
                    inputMapper,
                    outputFilters[ext]
                );
            };//}}}

        });

    };

    // Build help index route://{{{
    if (! Options.noHelp) R.get("/help", function renderHelpIndex(req, res, next) {
        res.header("Content-Type", "text/html");
        res.send(Tpl.helpIndex({
            path: Path.dirname(req.uri.pathname),
            fn: Object.keys(api).map(function(rtPath){return api[rtPath].help;}),
        }));
    });//}}}

    // Shorthand for single-method functions://{{{
    if (! Options.noLib) Object.keys(R.fn).filter(function(k){
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

    return R;
};//}}}

