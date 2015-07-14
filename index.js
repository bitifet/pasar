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
var Url = require("url");
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

function PASAR(api, Options) { //{{{

    var me = this;

    // Create new router:
    me.R = Express.Router();
    
    me.Prefs = this.buildPrefs(Options);

    // Attach Promise Engine:
    if (me.Prefs.promiseEngine) {
        me.R.Promise = me.Prefs.promiseEngine;
    } else if (! me.R.Promise) {
        me.R.Promise = require('promise');
    };
    
    var Tools = {
        exposeCallable: (function(){//{{{

            function buildFunction (handler, filter) {//{{{
                return function (input) {
                    return new me.R.Promise(function(resolve, reject){
                        handler.call(this, input)
                            .then(function(result){
                                resolve(filter(result));
                            })
                            .catch(reject)
                        ;
                    });
                };
            };//}}}

            return function buildCallable(fName, handler, method){ // Expose handler as callable function://{{{

                if (me.R.fn === undefined) {
                    me.R.fn = {};
                    me.R.syncFn = {};
                };

                // With default output filter:
                if (me.R.fn[fName] === undefined) {
                    me.R.fn[fName] = {};
                    me.R.syncFn[fName] = {};
                };
                me.R.fn[fName][method] = buildFunction(handler, exportFilters[Cfg.defaultOutputFilter]);
                me.R.syncFn[fName][method] = Util.depromise(me.R.fn[fName][method]);

                // For all available filters:
                if (! me.Prefs.noFilters) for (var ext in exportFilters) {
                    if (me.R.fn[fName+"."+ext] === undefined) {
                        me.R.fn[fName+"."+ext] = {};
                        me.R.syncFn[fName+"."+ext] = {};
                    };
                    me.R.fn[fName+"."+ext][method] = buildFunction(handler, exportFilters[ext]);
                    me.R.syncFn[fName+"."+ext][method] = Util.depromise(me.R.fn[fName+"."+ext][method]);
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
        if (! me.Prefs.noHelp) {
            spc.help = me.hlpAutocomplete(spc, rtPath);

            me.buildHandler(
                // Using buildHandler ensures consistent behaviour.
                rtPath + "/help"
                , Tpl.helpItem      // Directly injected Output formatter.
                , '/help'           // Facility name.
                , spc.help          // Actual input.
                , null              // No request handler.
                , function(input , outputFilter , res , next) {
                    res.header("Content-Type", "text/html");
                    res.send(outputFilter(input));
                }
                , Util.pick([ // Authentication Handler. //{{{
                    [spc.authHandler, "all"],
                    [spc.authHandler],
                    [me.Prefs.defaults, "authHandler.all"],
                    [me.Prefs.defaults, "authHandler"],
                    [Auth.defaultHandler] // Default.
                ], functionDuck)//}}}
                , Util.pick([ // Access Control properties. //{{{
                    [spc.ac],
                    [me.Prefs.ac],
                    {}
                ], functionDuck)//}}}
                , spc.ac                // Access Control data (from specification).
            );

        };//}}}

        Cfg.validMethods.map(function(method){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + method];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

            if (! me.Prefs.noLib) Tools.exposeCallable (fName, rtHandler, method);

            var requestMapper = Util.pick([//{{{
                [spc.requestMapper, method],
                [spc.requestMapper, "all"],
                [spc.requestMapper],
                [me.Prefs.defaults, "requestMapper."+method],
                [me.Prefs.defaults, "requestMapper.all"],
                [me.Prefs.defaults, "requestMapper"],
                [defaultRequestMapper] // Default.
            ], functionDuck);//}}}

            var responseMapper = Util.pick([//{{{
                [spc.responseMapper, method],
                [spc.responseMapper, "all"],
                [spc.responseMapper],
                [me.Prefs.defaults, "responseMapper."+method],
                [me.Prefs.defaults, "responseMapper.all"],
                [me.Prefs.defaults, "responseMapper"],
                [defaultResponseMapper] // Default.
            ], functionDuck);//}}}
            
            var authHandler = Util.pick([//{{{
                [spc.authHandler, method],
                [spc.authHandler, "all"],
                [spc.authHandler],
                [me.Prefs.defaults, "authHandler."+method],
                [me.Prefs.defaults, "authHandler.all"],
                [me.Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], functionDuck);//}}}


            // Append main route://{{{
            me.buildHandler(
                rtPath
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
            if (! me.Prefs.noFilters) for (var ext in exportFilters) {
                me.buildHandler(
                    rtPath
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
    if (! me.Prefs.noHelp) {
        me.buildHandler(
            // Using buildHandler ensures consistent behaviour.
            "/help"
            , Tpl.helpIndex     // Directly injected Output formatter.
            , '/help'           // Facility name.
            , function (input) {return input;}
            , function(req, method) {
                return {
                    path: Path.dirname(req.uri.pathname),
                    prefs: me.Prefs.client,
                    fn: Object.keys(api).map(function(rtPath){return api[rtPath].help;}),
                };
            }
            , function(input , outputFilter , res , next) {
                input.then(function(data){
                    res.header("Content-Type", "text/html");
                    res.send(outputFilter(data));
                }).catch(function(err){
                    Util.sendStatusMessage("error", err);
                });
            }
            , Util.pick([ // Authentication Handler. //{{{
                [spc.authHandler, "all"],
                [spc.authHandler],
                [me.Prefs.defaults, "authHandler.all"],
                [me.Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], functionDuck)//}}}
            , Util.pick([ // Access Control properties. //{{{
                [me.Prefs.ac],
                {}
            ], functionDuck)//}}}
        );
    };//}}}

    // Shorthand for single-method functions://{{{
    if (! me.Prefs.noLib) Object.keys(me.R.fn).filter(function(k){
        var methods = Object.keys(me.R.fn[k]);
        if ( // Function has only one (get/post/.../all) method.
            methods.length === 1
        ) { // Let to access it directly as me.R.fn[fName]() without ".get", ".post", etc..
            var mtd = methods[0];
            var asyncFn = me.R.fn[k][mtd];
            var syncFn = me.R.syncFn[k][mtd];
            me.R.fn[k] = asyncFn;
            me.R.fn[k][mtd] = asyncFn;
            me.R.syncFn[k] = syncFn;
            me.R.syncFn[k][mtd] = syncFn;
        };
    });//}}}


    // Do some cleanup:
    for (var i in Tools) delete Tools[i];

    return me.R;
};//}}}

PASAR.prototype.buildHandler = function buildHandler(//{{{
        pathSpec       // Base route path.
        , ext            // Extension (Output formatter). Ex.: "html"
        , service        // Method name (or "all") or facility name (Ex.: "/help");
        , ctrl           // Our actual functionality implementation returning promise.
        , requestMapper  // Request handler to obtain input object.
        , responseMapper // Response handler to serve returning data.
        , authHandler    // Authentication handler.
        , ac             // Access Control data (from specification).
) {
    var me = this;

    // Facilities:
    if (service[0] == "/") { // This is a facility handler.
        var method = "get"; // Facilities are always thought GET.
        var routePath = pathSpec;
        var outputFilter = ext; // Filter is directly injected.
    }
    // API function handlers:
    else if (! ext) { // Default route => Default output formatter.
        var method = service;
        var routePath = pathSpec;
        var outputFilter =  exportFilters[Cfg.defaultOutputFilter];
    } else { // Route with extension => Custom output formatter.
        var method = service;
        var routePath = pathSpec + "." + ext;
        var outputFilter = exportFilters[ext];
    };

    if (! outputFilter) outputFilter = function(input){return input;};
    if (! ac) ac = {};


    me.R[method](routePath, function (req,res,next) {

        var auth = Auth.trust(
            authHandler,
            pathSpec,
            ext,
            service,
            ac,
            req,
            res,
            next
        );

        if (! auth) return;


        var input = (typeof ctrl == "function")
            ? me.R.Promise.resolve(ctrl(
                requestMapper(req, method) // Our function input data.
                , auth
            ))
            : ctrl
        ;

        responseMapper(
            input 
            , function fullOutputFilter(input) {
                return outputFilter(   // Formatting filter.
                    auth.filter(input) // Authentication filter.
                );
            }
            , res
            , next
        );

    });

};//}}}

PASAR.prototype.hlpAutocomplete = function hlpAutocompleter(src, fnPath) {//{{{

    var me = this;
    var hlp = src.help;

    if (typeof hlp == "string") {
        hlp = {contents: hlp};
    } else if (hlp === undefined) {
        hlp = {};
    };
    hlp.meta = src.meta;
    hlp.path = fnPath;
    hlp.prefs = me.Prefs.client;

    if (! hlp.meta) hlp.meta = {};
    if (! hlp.contents) hlp.contents = "";

    if (! hlp.brief) hlp.brief = Util.txtCut(hlp.contents, Cfg.tplBriefLength);

    for (var i in hlp) {
        switch(i){
        // Text fields:
        case "brief":
            break;
        // Html fields:
        default:
            hlp[i] = Util.nl2br(hlp[i]);
        };
    };


    hlp.methods = Util.mapMethods (//{{{
        src,
        hlp.methods,
        "(undocumented)",
        function expandMethodHelp(value, implemented) {
            return {
                description: value,
                implemented: implemented,
            };
        }
    );//}}}


    Util.propSet(hlp, "examples", Util.propGet(me.Prefs, "defaults.help.examples")); // Get defaults.

    hlp.examples = Util.mapMethods (//{{{
        src,
        hlp.examples,
        undefined,
        function expandMethodExamples(input, implemented, method) {
            if (input === undefined) return;
            var output = [];
            for (var i in input) {
                if (input[i] instanceof Array) {
                    var lbl = input[i][0];
                    var prm = input[i][1];
                    var comments = input[i][2];
                } else {
                    var prm = input[i];
                    var comments = '';
                };
                var url = method == "get"
                    ? Url.format({
                        pathname: ".." + hlp.path,
                        query: prm,
                    })
                    : "#"
                ;
                if (typeof lbl === "object" || ! lbl) lbl = url.substring(2);

                output.push({
                    method: method,
                    label: lbl,
                    prm: prm,
                    comments: comments,
                    url: url,
                });
            };
            return output;
        }
    );//}}}

    return hlp;
};//}}}
    
PASAR.prototype.buildPrefs = function applyDefaultPreferences(Options) {//{{{

    var prefs = {};
    Util.propExpand(Options);

    // Sanityze options:
    if (Options === undefined) Options = {};

    // Accept all options as preferences:
    Object.keys(Options).filter(function(k){
        prefs[k] = Options[k];
    });

    // Define some extra default values:
    Util.propSet(prefs, "client.jQuery", Cfg.paths.jQuery);

    return prefs;

};//}}}




function apiBuilder (apiSpec, Options) {//{{{
    return new PASAR(apiSpec, Options);
};
apiBuilder.prototype = PASAR;//}}}

module.exports = apiBuilder;

// Usage example:
// ==============
//
// var Pasar = require("pasar");
//
// To build API instance:
// var myApiRouter = new Pasar(apiSpec, Options);
//
// ...or simply:
// var myApiRouter = Pasar(apiSpec, Options);

