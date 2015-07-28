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

function PASAR(api, Options) { //{{{

    var me = this;
    me.R = Express.Router();                // Create new router.
    me.Prefs = this.buildPrefs(Options);    // Initialyze preferences.
    me.facilities = {};                     // Facility models.
    me.R.Promise = me.Prefs.promiseEngine   // Pick for Promise engine.//{{{
        ? me.Prefs.promiseEngine
        : require('promise')
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
    for (var srvName in api) {
        var fName = srvName.replace("/", "_"); // Exposed function name.
        var spc = api[srvName];                // Function full specification.
        var fltIndex = {};

        spc.path = (function guessRoutePath(srvName, spc) { // Resolve route path.//{{{
            var rtPath = spc.path; // Let to specify complete route Path without messing service name.
            if (rtPath === undefined) rtPath = srvName; // Default to service name if not provided.
            if (rtPath[0] !== "/") rtPath = "/" + rtPath; // Fix starting slash when missing.
            return rtPath;
        })(srvName, spc);//}}}

        // Build all service method routes: //{{{
        // --------------------------------
        Cfg.validMethods.map(function(method){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + method];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

            var outputFilters = Fmt.load(//{{{
                me.Filters
                , Util.pick([
                    [spc.outputFilters, method],
                    [spc.outputFilters, "all"],
                    [spc.outputFilters],
                    [{}],
                ])
            );
            if (! me.Prefs.noHelp) {
                me.indexFilters (fltIndex, outputFilters, method);
            };//}}}

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

            if (! me.Prefs.noLib) me.exposeCallable (//{{{
                fName
                , rtHandler
                , method
                , outputFilters
            );//}}}

            // Append main route://{{{
            me.buildHandler(
                spc.path
                , method
                , me.defaultFilter
                , rtHandler
                , requestMapper
                , responseMapper
                , authHandler
                , spc.ac
            );
            //}}}

            // Append routes for all available output filters://{{{
            if (! me.Prefs.noFilters) for (var ext in outputFilters) {
                me.buildHandler(
                    spc.path
                    , method
                    , [outputFilters[ext], ext]
                    , rtHandler
                    , requestMapper
                    , responseMapper
                    , authHandler
                    , spc.ac
                );
            };//}}}

        });
        // -------------------------------- //}}}

        // Build service/facility routes: //{{{
        // ------------------------------

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

            // Handle me.Prefs.noHelp, .noForm, etc...
            if (me.Prefs["no" + f[0].toUpperCase() + f.substring(1)]) return;

            me.buildFacility(
                srvName,
                f,
                spc,
                Facilities[f],
                fltIndex,
                facilityAuthHandler,
                facilityAC
            );

        });//}}}

        // ------------------------------ //}}}

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

PASAR.prototype.indexFilters = function (target, fdata, method) {//{{{
    for (var ext in fdata) {
        var contents = fdata[ext].help;
        if (! contents) contents = ext + " output formatter"; // Description failback.
        var key = JSON.stringify(contents);
        if (target[ext] === undefined) target[ext] = {};
        if (target[ext][key] === undefined) target[ext][key] = {
            contents: contents,
            methods: [],
        };
        target[ext][key].methods.push(method);
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
        spc.path + "/"+facName
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
        , function(req, method) {
            console.log(req);
            var model = {
                path: req.baseUrl,
                name: facName,
                prefs: me.Prefs.client,
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

    return function buildCallable(srvName, handler, method, Filters){ // Expose handler as callable function://{{{

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
        me.R.fn[srvName][method] = buildFunction(me.R, handler, me.defaultFilter);
        me.R.syncFn[srvName][method] = Util.depromise(me.R.fn[srvName][method]);

        // For all available filters:
        if (! me.Prefs.noFilters) for (var ext in Filters) {
            if (me.R.fn[srvName+"."+ext] === undefined) {
                me.R.fn[srvName+"."+ext] = {};
                me.R.syncFn[srvName+"."+ext] = {};
            };
            var f = buildFunction(me.R, handler, Filters[ext]);
            me.R.fn[srvName+"."+ext][method] = f;
            me.R.syncFn[srvName+"."+ext][method] = Util.depromise(f);
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

