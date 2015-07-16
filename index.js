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
    
    // Populate all specified services:
    for (var srvName in api) {
        var fName = srvName.replace("/", "_"); // Exposed function name.
        var spc = api[srvName];               // Function full specification.

        var rtPath = (function guessRoutePath(srvName, spc) {
            var rtPath = spc.path; // Let to specify complet route Path without messing service name.
            if (rtPath === undefined) rtPath = srvName; // Default to service name if not provided.
            if (rtPath[0] !== "/") rtPath = "/" + rtPath; // Fix starting slash when missing.
            return rtPath;
        })(srvName, spc);

        // Build help item route://{{{
        if (! me.Prefs.noHelp) {
            spc.help = me.hlpAutocomplete(spc, rtPath);

            me.buildHandler(
                // Using buildHandler ensures consistent behaviour.
                rtPath + "/help"
                , '/help'           // Facility name.
                , Tpl.helpItem      // Directly injected Output formatter.
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
                ], Util.duckFn)//}}}
                , Util.pick([ // Access Control properties. //{{{
                    [spc.ac],
                    [me.Prefs.ac],
                    {}
                ], Util.duckFn)//}}}
                , spc.ac                // Access Control data (from specification).
            );

        };//}}}

        Cfg.validMethods.map(function(method){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + method];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

            if (! me.Prefs.noLib) me.exposeCallable (fName, rtHandler, method);

            var requestMapper = Util.pick([//{{{
                [spc.requestMapper, method],
                [spc.requestMapper, "all"],
                [spc.requestMapper],
                [me.Prefs.defaults, "requestMapper."+method],
                [me.Prefs.defaults, "requestMapper.all"],
                [me.Prefs.defaults, "requestMapper"],
                [defaultRequestMapper] // Default.
            ], Util.duckFn);//}}}

            var responseMapper = Util.pick([//{{{
                [spc.responseMapper, method],
                [spc.responseMapper, "all"],
                [spc.responseMapper],
                [me.Prefs.defaults, "responseMapper."+method],
                [me.Prefs.defaults, "responseMapper.all"],
                [me.Prefs.defaults, "responseMapper"],
                [defaultResponseMapper] // Default.
            ], Util.duckFn);//}}}
            
            var authHandler = Util.pick([//{{{
                [spc.authHandler, method],
                [spc.authHandler, "all"],
                [spc.authHandler],
                [me.Prefs.defaults, "authHandler."+method],
                [me.Prefs.defaults, "authHandler.all"],
                [me.Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], Util.duckFn);//}}}


            // Append main route://{{{
            me.buildHandler(
                rtPath
                , method
                , exportFilters[Cfg.defaultOutputFilter]
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
                    , method
                    , [exportFilters[ext], ext]
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
            , '/help'           // Facility name.
            , Tpl.helpIndex     // Directly injected Output formatter.
            , Util.dumbFn
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
            ], Util.duckFn)//}}}
            , Util.pick([ // Access Control properties. //{{{
                [me.Prefs.ac],
                {}
            ], Util.duckFn)//}}}
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

    return me.R;
};//}}}

PASAR.prototype.buildHandler = function buildHandler(//{{{
        pathSpec       // Base route path.
        , service        // Method name (or "all") or facility name (Ex.: "/help");
        , flt            // [outputFilter, fileExtension]
        , ctrl           // Our actual functionality implementation returning promise.
        , requestMapper  // Request handler to obtain input object.
        , responseMapper // Response handler to serve returning data.
        , authHandler    // Authentication handler.
        , ac             // Access Control data (from specification).
) {
    var me = this;

    if (! (flt instanceof Array)) flt = [flt];
    var ext = flt[1];
    var outputFilter = flt[0];

    var method = (service[0] == "/")
        ? "get"     // Facilitiy. Always called thought GET method.
        : service   // Actual service method handler.
    ;

    var routePath = ext
        ? pathSpec + "." + ext
        : pathSpec
    ;

    if (! ac) ac = {};

    // Output Filter and Output Filter runtime options://{{{
    if (! outputFilter) outputFilter = Util.dumbFn; // Default Output Filter.

    // Request handler to retrive runtime options for output filter.
    var ofReqHandler = (typeof outputFilter.requestHandler == "function")
        ? outputFilter.requestHandler
        : function (req) {return {};} // (Default)
    ;
    // NOTE: Output filters are usually expected to NOT depend on request input.
    //  ...but, defining a requestHandler property over them, you could easily change that.
    //}}}

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
                return outputFilter(     // Formatting filter.
                    auth.filter(input)   // Authentication filter.
                    , ofReqHandler(req)  // Runtime output filter options (usually {}).
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

    // Sanityze options:
    if (Options === undefined) Options = {};
    Util.propExpand(Options);

    // Accept all options as preferences:
    var prefs = Util.oMap(Options, Util.dumbFn);

    // Define some extra default values:
    Util.propSet(prefs, "client.jQuery", Cfg.paths.jQuery);

    return prefs;

};//}}}

PASAR.prototype.exposeCallable = (function(){//{{{

    function buildFunction (router, handler, filter) {//{{{
        return function (input) {
            return new router.Promise(function(resolve, reject){
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

        var me = this;

        if (me.R.fn === undefined) {
            me.R.fn = {};
            me.R.syncFn = {};
        };

        // With default output filter:
        if (me.R.fn[fName] === undefined) {
            me.R.fn[fName] = {};
            me.R.syncFn[fName] = {};
        };
        me.R.fn[fName][method] = buildFunction(me.R, handler, exportFilters[Cfg.defaultOutputFilter]);
        me.R.syncFn[fName][method] = Util.depromise(me.R.fn[fName][method]);

        // For all available filters:
        if (! me.Prefs.noFilters) for (var ext in exportFilters) {
            if (me.R.fn[fName+"."+ext] === undefined) {
                me.R.fn[fName+"."+ext] = {};
                me.R.syncFn[fName+"."+ext] = {};
            };
            me.R.fn[fName+"."+ext][method] = buildFunction(me.R, handler, exportFilters[ext]);
            me.R.syncFn[fName+"."+ext][method] = Util.depromise(me.R.fn[fName+"."+ext][method]);
        };

    }; //}}}

})();//}}}



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

