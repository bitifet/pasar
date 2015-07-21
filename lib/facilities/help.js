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
var Cfg = require("../../cfg.js");
var Util = require("../util.js");

var Tpl = {//{{{
    item: Util.tpl("helpItem.jade"),
    index: Util.tpl("helpIndex.jade"),
};//}}}

function modelParser(prefs, spc, rtPath, fltIndex) {//{{{

    var hlp = spc.help;

    if (typeof hlp == "string") {
        hlp = {contents: hlp};
    } else if (hlp === undefined) {
        hlp = {};
    };
    hlp.meta = spc.meta;
    hlp.path = rtPath;
    hlp.prefs = prefs.client;
    hlp.filters = fltIndex;

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
        spc,
        hlp.methods,
        "(undocumented)",
        function expandMethodHelp(value, implemented) {
            return {
                description: value,
                implemented: implemented,
            };
        }
    );//}}}

    Util.propSet(hlp, "examples", Util.propGet(prefs, "defaults.help.examples")); // Get defaults.

    hlp.examples = Util.mapMethods (//{{{
        spc,
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

module.exports = {
    modelParser: modelParser,
    tpl: Tpl,
};
