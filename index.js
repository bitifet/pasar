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

function defaultRequestMapper (req, method) {//{{{
    return req.body;
};//}}}

var outputFilters = (//{{{
    function (src) { // Wrap common input checkins wrapping:
        var flt = {};
        Object.keys(src).map(function wrapFixations(fltName) {
            flt[fltName] = function(input) {
                if (input === undefined) input = {};
                if (input.meta === undefined) input.meta = {};
                if (input.data === undefined) input.data = {};
                return src[fltName](input);
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


module.exports = function APIloader(api) { //{{{
    // Create local router and attach to master one.
    var R = Express.Router();

    // Populate all specified routes:
    for (var rtPath in api) {
        var spc = api[rtPath];
        rtPath = "/" + rtPath;
        spc.help = Util.hlpAutocomplete(spc, rtPath);

        (function (hlp) {
            R.get(rtPath + "/help", function renderHelpItem(req, res, next) {
                res.header("Content-Type", "text/html");
                res.send(Tpl.helpItem(hlp));
            });
        })(spc.help);

        Cfg.validMethods.map(function(method){

            // Get route Handler (Controller)://{{{
            var rtHandler = spc["_" + method];
            if (rtHandler === undefined) return; // Avoid trying to map unspecified method handlers.
            //}}}

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
                outputFilters.json
            );
            //}}}

            // Append routes for all available output filters://{{{
            for (var ext in outputFilters) {
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

    R.get("/help", function renderHelpIndex(req, res, next) {
        res.header("Content-Type", "text/html");
        res.send(Tpl.helpIndex({
            path: Path.dirname(req.uri.pathname),
            fn: Object.keys(api).map(function(rPath){return api[rPath].help;}),
        }));
    });




    return R;
};//}}}

