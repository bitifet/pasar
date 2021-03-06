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
//
// Usage example:
// --------------
//
// var Pasar = require("pasar");
//
// To build API instance:
// var myApiRouter = new Pasar(apiSpec, Options);
//
// ...or simply:
// var myApiRouter = Pasar(apiSpec, Options);

"use strict";
var Path = require("path");
var Express = require("express");
var Chalk = require("chalk");
var Cfg = require("./cfg.js");
var Util = require("./lib/util.js");
var Auth = require("./lib/auth.js");
var Fmt = require("./lib/formatters.js");
var defaultRequestMapper = require("./lib/defaultRequestMapper.js");
var defaultResponseMapper = require("./lib/defaultResponseMapper.js");
var Facilities = {
    help: require("./lib/facilities/help"),
    form: require("./lib/facilities/form"),
};

function PASAR(api, Options, cri) { //{{{

    var me = this;
    me.R = Express.Router();                // Create new router.
    me.Prefs = this.buildPrefs(Options);    // Initialyze preferences.
    me.cri = cri; cri || (me.cri = {});     // Common Resources Interface.
    me.services = {};                       // Services object.
    me.facilities = {};                     // Facility models.
    me.R.Promise = me.Prefs.promiseEngine   // Pick for Promise engine.//{{{
        ? me.Prefs.promiseEngine
        : Promise
    ;//}}}
    me.Filters = Fmt.load(                  // Load output filters.//{{{
        {}
        , Fmt.filters               // Load all core filters by default.
        , me.Prefs.outputFilters    // Let to disable, change or reconfigure
                                    // all of them thought outputFilters Option.
    );//}}}
    me.defaultFilter = Fmt.check(           // Set default filter.//{{{
        me.Filters[me.Prefs.defaultFilter],
        me.Prefs.defaultFilter
    );//}}}
    
    // Populate all specified services://{{{
    // ================================
    if (api instanceof Array) api = Util.oExtend(api);
    // Let to provide multiple parts packed in arrays for better modularization.
    for (var srvName in api) {
        var fName = srvName.replace("/", "_"); // Exposed function name.
        var spc = api[srvName];                // Function full specification.
        var fltIndex = {};
        spc.srvName = srvName;

        spc.path = (function guessRoutePath(srvName, spc) { // Resolve route path.//{{{
            var rtPath = spc.path; // Let to specify complete route Path without messing service name.
            if (rtPath === undefined) rtPath = [srvName]; // Default to service name if not provided.
            if (! (rtPath instanceof Array)) rtPath = [rtPath];
            rtPath = rtPath.map(function(p){return (p[0]=="/"?"":"/")+p;}); // Fix starting slash when missing.
            return rtPath;
        })(srvName, spc);//}}}


        // Prepare service/facility routes: //{{{
        // --------------------------------

        var srvFacilities = (function(){

            var fac = {
                pre: [],
                post: [],
            };

            var facilityAuthHandler =  Util.pick([ // Authentication Handler. //{{{
                [spc.authHandler, "all"],
                [spc.authHandler],
                [me.Prefs.defaults, "authHandler.all"],
                [me.Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], Util.duckFn);//}}}
            var facilityAC = Util.pick([ // Access Control properties. //{{{
                [spc.ac],
                [me.Prefs.ac],
                {}
            ], Util.duckFn);//}}}
            Object.keys(Facilities).map(function(f){//{{{

                var F = f[0].toUpperCase() + f.substring(1);

                // Handle me.Prefs.noHelp, .noForm, etc...
                if (me.Prefs["no"+F]) return;

                var target = Util.pick([
                        [me.Prefs["allowOverride"+F]]
                        , [me.Prefs["allowOverrideAllFacilities"]]
                        , [false]
                ]) ? "post" : "pre";

                fac[target].push([
                    srvName,
                    f,
                    spc,
                    Facilities[f],
                    fltIndex,
                    facilityAuthHandler,
                    facilityAC
                ]);


            });//}}}

            return fac;

        })();

        // -------------------------------- //}}}

        srvFacilities.pre.map(function(f){
            me.buildFacility.apply(me, f);
        });

        // Build all service method routes: //{{{
        // --------------------------------
        Cfg.validMethods.map(function(srvMethod){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + srvMethod];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

            var outputFilters = Fmt.load(//{{{
                me.Filters
                , Util.pick([
                    [spc.outputFilters, srvMethod],
                    [spc.outputFilters, "all"],
                    [spc.outputFilters],
                    [{}],
                ])
            );
            me.indexFilters (fltIndex, outputFilters, srvMethod);
            //}}}

            var requestMapper = Util.pick([//{{{
                [spc.requestMapper, srvMethod],
                [spc.requestMapper, "all"],
                [spc.requestMapper],
                [me.Prefs.defaults, "requestMapper."+srvMethod],
                [me.Prefs.defaults, "requestMapper.all"],
                [me.Prefs.defaults, "requestMapper"],
                [defaultRequestMapper] // Default.
            ], Util.duckFn);//}}}

            var responseMapper = Util.pick([//{{{
                [spc.responseMapper, srvMethod],
                [spc.responseMapper, "all"],
                [spc.responseMapper],
                [me.Prefs.defaults, "responseMapper."+srvMethod],
                [me.Prefs.defaults, "responseMapper.all"],
                [me.Prefs.defaults, "responseMapper"],
                [defaultResponseMapper] // Default.
            ], Util.duckFn);//}}}
            
            var authHandler = Util.pick([//{{{
                [spc.authHandler, srvMethod],
                [spc.authHandler, "all"],
                [spc.authHandler],
                [me.Prefs.defaults, "authHandler."+srvMethod],
                [me.Prefs.defaults, "authHandler.all"],
                [me.Prefs.defaults, "authHandler"],
                [Auth.defaultHandler] // Default.
            ], Util.duckFn);//}}}

            // Sanityze timeout parameter://{{{
            // ---------------------------
            var timeOut = Util.pick([
                [spc.timeout, srvMethod],
                [spc.timeout, "all"],
                [spc.timeout]
            ]);
            if (timeOut !== undefined) {
                var timeOutMessage = me.Prefs.defaultTimeoutMessage; // Default msg.
                if (timeOut instanceof Array) { // Accept [timeut, msg] syntax.//{{{
                    if (typeof timeOut[1] == "string" && timeOut[1].length) timeOutMessage = timeOut[1];
                    timeOut=timeOut[0];
                };//}}}
                timeOut=Math.abs(+timeOut);
                timeOut = (timeOut && !isNaN(timeOut))
                    ? [timeOut, timeOutMessage]
                    : undefined; // Disable on falsy or NaN.
                ;
            };
            // ---------------------------//}}}


            var serviceHandler = me.indexRtHandler(
                srvName
                , srvMethod
                , rtHandler
                , timeOut
            );

            if (! me.Prefs.noLib) me.exposeCallable (//{{{
                fName
                , serviceHandler
                , srvMethod
                , outputFilters
            );//}}}

            for (var i in spc.path) {

                var flt = {
                    pre: [],
                    post: [],
                };

                // Prepare routes for all available output filters://{{{
                if (! me.Prefs.noFilters) for (var ext in outputFilters) {

                    var E = ext[0].toUpperCase() + ext.substring(1);

                    var target = Util.pick([
                            [me.Prefs["allow"+E+"FilterOverride"]]
                            , [me.Prefs["allowAllFiltersOverride"]]
                            , [false]
                    ]) ? "post" : "pre";

                    flt[target].push([
                        spc.path[i]
                        , srvMethod
                        , [outputFilters[ext], ext]
                        , serviceHandler
                        , requestMapper
                        , responseMapper
                        , authHandler
                        , spc.ac
                    ]);
                };//}}}

                flt.pre.map(function(f){
                    me.buildHandler.apply(me, f);
                });

                // Append main route://{{{
                me.buildHandler(
                    spc.path[i]
                    , srvMethod
                    , me.defaultFilter
                    , serviceHandler
                    , requestMapper
                    , responseMapper
                    , authHandler
                    , spc.ac
                );
                //}}}

                flt.post.map(function(f){
                    me.buildHandler.apply(me, f);
                });

            };

        });
        // -------------------------------- //}}}

        srvFacilities.post.map(function(f){
            me.buildFacility.apply(me, f);
        });

    };
    // ================================//}}}

    // Build all /facility routes://{{{
    // ---------------------------
    var facilityAuthHandler = Util.pick([ // Authentication Handler. //{{{
        [spc.authHandler, "all"],
        [spc.authHandler],
        [me.Prefs.defaults, "authHandler.all"],
        [me.Prefs.defaults, "authHandler"],
        [Auth.defaultHandler] // Default.
    ], Util.duckFn);//}}}
    var facilityAC = Util.pick([ // Access Control properties. //{{{
        [me.Prefs.ac],
        {}
    ], Util.duckFn);//}}}

    Object.keys(Facilities).map(function(f){//{{{

        // Handle me.Prefs.noHelp, .noForm, etc...
        if (me.Prefs["no" + f[0].toUpperCase() + f.substring(1)]) return;

        me.buildRootFacility(
            api,
            f,
            Facilities[f],
            facilityAuthHandler,
            facilityAC
        );

    });//}}}


    // ---------------------------//}}}

    // Shorthand for single-method functions://{{{
    if (! me.Prefs.noLib) Object.keys(me.R.fn).filter(function(k){
        var srvMethods = Object.keys(me.R.fn[k]);
        if ( // Function has only one (get/post/.../all) method.
            srvMethods.length === 1
        ) { // Let to access it directly as me.R.fn[fName]() without ".get", ".post", etc..
            var mtd = srvMethods[0];
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


PASAR.prototype.indexRtHandler = function indexRtHandler(//{{{
    srvName         // Service Name.
    , method        // Method
    , rtHandler     // Actual handler.
    , timeOut        // Maximum permitted execution time.
) {
    var me = this;

    if (me.services[srvName] === undefined) me.services[srvName] = {};
    me.services[srvName][method] = function() {
        var pbk = {}; // "Promise-callbacks" placeholder.
        /*#/ arguments[0] = (- Actual input -)
        /*#/ arguments[1] = (- Authentication handler -)
        /**/ arguments[2] = me.cri; // (Common Resources Interface)
        /**/ arguments[3] = pbk;

        var p = me.R.Promise.resolve(rtHandler.apply(me.services, arguments));
        var serviceHandler = timeOut
            ? new me.R.Promise(function(resolve, reject){
                var t = setTimeout(
                    function(){
                        reject(timeOut[1]); // Message.
                        // Call cleanup function if provided:
                        if (typeof pbk.cleanup == "function") pbk.cleanup();
                    }
                    , timeOut[0] // Delay.
                );
                p.then(function(data){
                    clearTimeout(t);
                    resolve(data);
                });
            })
            : p
        ;

        if (me.Prefs.logErrors) {
            serviceHandler.catch(function(err){
                console.error(
                    Chalk.bgRed("SERVICE_ERROR")
                    +Chalk.red(" ("+srvName+")")
                    + ":"
                    , err
                );
            });
        };

        return serviceHandler;
    };

    return me.services[srvName][method];
};//}}}

PASAR.prototype.buildHandler = function buildHandler(//{{{
    pathSpec         // Base route path.
    , service        // Method name (or "all") or facility name (Ex.: "/help");
    , flt            // [outputFilter, fileExtension]
    , srvHandler     // Our actual functionality implementation returning promise.
    , requestMapper  // Request handler to obtain input object.
    , responseMapper // Response handler to serve returning data.
    , authHandler    // Authentication handler.
    , ac             // Access Control data (from specification).
) {

    var me = this;

    // Pick extension and outputFilter://{{{
    // --------------------------------

    // Extract extension specification when provided:
    if (! (flt instanceof Array)) flt = [flt]; // Accept simpler syntax (without extension).
    var ext = flt[1]; // Extension (if any).
    var outputFilter = flt[0];      // Output Filter.

    // Default Output Filter.
    if (! outputFilter) outputFilter = Util.dumbFn;

    // Optional request handler to retrieve runtime options for output filter.
    var ofReqHandler = (typeof outputFilter.requestHandler == "function")
        ? outputFilter.requestHandler
        : function (req) { // (Default)
            // NOTE: Output filters are usually expected to NOT depend on request input.
            //  ...but somtimes could be useful to slightly alter formating depending on
            //  request attributes such xhr that indicates we are responding to
            //  AJAX request so, for example, html output filters, probably
            //  should not render html headers.
            return {
                xhr: req.xhr, // Request is XMLHttpRequest (AJAX)
            };
        }
    ;

    // --------------------------------//}}}

    // Determine actual service method://{{{
    // --------------------------------
    var srvMethod = (service[0] == "/")
        ? "get"     // Facilitiy. Always called thought GET method.
        : service   // Actual service method handler.
    ;
    // --------------------------------//}}}

    // Autocomplete routePath://{{{
    // -----------------------
    var routePath = ext
        ? pathSpec + "." + ext
        : pathSpec
    ;
    // -----------------------//}}}

    // Sanityze ac://{{{
    // ------------
    if (! ac) ac = {};
    // ------------//}}}

    // Sanityze requestMapper://{{{
    // -----------------------
    if (typeof requestMapper != "function") requestMapper = function(){
        return requestMapper;
    };
    // -----------------------//}}}


    // Build core controller://{{{
    // ----------------------
    var ctrl = (typeof srvHandler == "function")
        ? function(input, auth) {
            return me.R.Promise.resolve(srvHandler(
                input
                , auth
                , null // RESERVED (injected in indexRtHandler())
                , null // RESERVED (injected in indexRtHandler())
            ));
        }
        : function(){
            return srvHandler;
        }
    ;
    // ----------------------//}}}

    // Build and route service://{{{
    // ------------------------
    me.R[srvMethod](routePath, function (req,res,next) {

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

        var input = ctrl(
            requestMapper(req, srvMethod) // Our function input data.
            , auth
        );

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
    // ------------------------//}}}

};//}}}

PASAR.prototype.indexFilters = function (target, fdata, srvMethod) {//{{{
    for (var ext in fdata) {
        var contents = fdata[ext].help;
        if (! contents) contents = ext + " output formatter"; // Description failback.
        var key = JSON.stringify(contents);
        if (target[ext] === undefined) target[ext] = {};
        if (target[ext][key] === undefined) target[ext][key] = {
            contents: contents,
            methods: [],
        };
        target[ext][key].methods.push(srvMethod);
    };
};//}}}

PASAR.prototype.buildFacility = function buildFacility(//{{{
    srvName
    , facName
    , spc
    , facility
    , fltIndex
    , authHandler
    , ac
) {

    var me = this;

    if (me.facilities[facName] === undefined) me.facilities[facName] = {};
    me.facilities[facName][srvName] = facility.itemParser(me.Prefs, spc, srvName, facName, fltIndex);

    me.buildHandler(
        // Using buildHandler ensures consistent behaviour.
        "/"+srvName+"/"+facName
        , "/"+facName           // Facility name.
        , facility.tpl.item   // Directly injected Output formatter.
        , me.facilities[facName][srvName]          // Actual input.
        , null                // No request handler.
        , function(input , outputFilter , res , next) {
            res.header("Content-Type", "text/html");
            res.send(outputFilter(input));
        }
        , authHandler
        , ac
    );

};//}}}

PASAR.prototype.buildRootFacility = function buildRootFacility (//{{{
    spc,
    facName, // Facility name.
    facility,
    authHandler,
    ac
) {
    var me = this;
    me.buildHandler(
        // Using buildHandler ensures consistent behaviour.
        "/"+facName
        , "/"+facName
        , facility.tpl.index   // Directly injected Output formatter.
        , Util.dumbFn
        , function(req, srvMethod) {
            var model = {
                path: req.baseUrl,
                name: facName,
                fn: Object.keys(spc).map(function(srvName){return me.facilities[facName][srvName];}),
            };
            model.title = facility.buildTitle(model);
            return model;
        }
        , function(input , outputFilter , res , next) {
            input.then(function(data){
                res.header("Content-Type", "text/html");
                res.send(outputFilter(data));
            }).catch(function(err){
                Util.sendStatusMessage(res, "error", err);
            });
        }
        , authHandler
        , ac
    );

};//}}}

PASAR.prototype.buildPrefs = function applyDefaultPreferences(Options) {//{{{

    // Sanityze options:
    if (Options === undefined) Options = {};
    Util.propExpand(Options);

    // Accept all options as preferences:
    var prefs = Util.oMap(Options, Util.dumbFn);

    // Select default output filter:
    Util.propSet(prefs, "defaultFilter", Cfg.defaultOutputFilter);

    // Define default timeout message:
    Util.propSet(prefs, "defaultTimeoutMessage", Cfg.defaultTimeoutMessage);

    // Initialize logErrors:
    Util.propSet(prefs, "logErrors", Cfg.defaultLogErrors);

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

    return function buildCallable(srvName, handler, srvMethod, Filters){ // Expose handler as callable function://{{{

        var me = this;

        if (me.R.fn === undefined) {
            me.R.fn = {};
            me.R.syncFn = {};
        };

        // With default output filter:
        if (me.R.fn[srvName] === undefined) {
            me.R.fn[srvName] = {};
            me.R.syncFn[srvName] = {};
        };
        me.R.fn[srvName][srvMethod] = buildFunction(me.R, handler, me.defaultFilter);
        me.R.syncFn[srvName][srvMethod] = Util.depromise(me.R.fn[srvName][srvMethod]);

        // For all available filters:
        if (! me.Prefs.noFilters) for (var ext in Filters) {
            if (me.R.fn[srvName+"."+ext] === undefined) {
                me.R.fn[srvName+"."+ext] = {};
                me.R.syncFn[srvName+"."+ext] = {};
            };
            var f = buildFunction(me.R, handler, Filters[ext]);
            me.R.fn[srvName+"."+ext][srvMethod] = f;
            me.R.syncFn[srvName+"."+ext][srvMethod] = Util.depromise(f);
        };

    }; //}}}

})();//}}}


function apiBuilder (apiSpec, Options, cri) {//{{{
    return new PASAR(apiSpec, Options, cri);
};
apiBuilder.prototype = PASAR;//}}}

module.exports = apiBuilder;

