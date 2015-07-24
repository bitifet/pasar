// PASAR - lib/facilities/help.js
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
var Url = require("url");
var Cfg = require("../../../cfg.js");
var Util = require("../../util.js");

var Tpl = {//{{{
    item: Util.tpl(__dirname + "/helpItem.jade"),
    index: Util.tpl(__dirname + "/helpIndex.jade"),
};//}}}

function itemModelParser(prefs, spc, srvName, fName, fltIndex) {//{{{

    var model = spc[fName];

    if (typeof model == "string") {
        model = {contents: model};
    } else if (model === undefined) {
        model = {};
    };
    model.title = spc.path+" ("+spc.meta.title+")";
    model.meta = spc.meta;
    model.path = spc.path;
    model.name = fName;
    model.prefs = prefs.client;
    model.filters = fltIndex;

    if (! model.meta) model.meta = {};
    if (! model.contents) model.contents = "";

    if (! model.brief) model.brief = Util.txtCut(model.contents, Cfg.tplBriefLength);

    for (var i in model) {
        switch(i){
        // Text fields:
        case "brief":
            break;
        // Html fields:
        default:
            model[i] = Util.nl2br(model[i]);
        };
    };

    model.methods = Util.mapMethods (//{{{
        spc,
        model.methods,
        "(undocumented)",
        function expandMethodHelp(value, implemented) {
            return {
                description: value,
                implemented: implemented,
            };
        }
    );//}}}

    Util.propSet(model, "examples", Util.propGet(prefs, "defaults.help.examples")); // Get defaults.

    model.examples = Util.mapMethods (//{{{
        spc,
        model.examples,
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
                if (typeof lbl === "object" || ! lbl) lbl = model.path;

                output.push({
                    method: method,
                    label: lbl,
                    prm: prm,
                    comments: comments,
                    url: function(ext){
                        ext = ext ? "." + ext : "";
                        return method == "get"
                            ? Url.format({
                                pathname: ".." + model.path + ext,
                                query: prm,
                            })
                            : "#"
                        ;
                    },
                });
            };
            return output;
        }
    );//}}}

    return model;
};//}}}


module.exports = {
    buildTitle: function (model) {return "API function Index for " + model.path;},
    itemParser: itemModelParser,
    tpl: Tpl,
};
