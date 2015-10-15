// PASAR - lib/facilities/form/index.js
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
var Fs = require("fs");
var Jade = require("jade");
var Cfg = require("../../../cfg.js");
var Util = require("../../util.js");

var defaultTemplate = Fs.readFileSync(__dirname+"/defaultFormTemplate.jade");

var Tpl = {//{{{
    item: Util.tpl(__dirname + "/formItem.jade"),
    index: Util.tpl(__dirname + "/formIndex.jade"),
};//}}}

function modelParser(prefs, spc, srvName, fName, fltIndex) {//{{{

    var forms = spc[fName];
    if ( // Make 'form' become shorthand for 'form.all'.//{{{
        typeof forms != "object"
        || forms instanceof Array
    ) {
        forms = {all: forms};
    };//}}}
    for (var m in forms) { // Allow to define Jade template as array of rows.//{{{
        if (forms[m] instanceof Array) {
            forms[m] = forms[m].join("\n") + "\n";
        };
    };//}}}

    var model = {
        meta: spc.meta,
        srvName: spc.srvName,
        path: spc.path,
        name: fName,
        prefs: prefs.client,
        filters: fltIndex,
    };
    if (! model.meta) model.meta = {};

    model.methods = Util.mapMethods (//{{{
        spc,
        forms,
        defaultTemplate,
        function expandMethodTemplate(tpl, unimplemented, method, isDefault) {
            var compileError;
            try {
                if (tpl === undefined || tpl === "") {
                    tpl = Jade.compile(defaultTemplate)();
                    isDefault = true;
                } else {
                    if ((typeof tpl != "string") || ! tpl.length) throw "Wrong template";
                    tpl = Jade.compile(tpl)();
                };
            } catch (err) {
                tpl = Jade.compile(defaultTemplate)();
                compileError = err;
                isDefault = true;
            };
            return {
                tpl: tpl,
                isDefault: isDefault,
                unimplemented: unimplemented,
                error: compileError,
            };
        }
    );
    //}}}

    return model;
};//}}}

module.exports = {
    buildTitle: function (model) {return "Form Index for " + model.path;},
    itemParser: modelParser,
    tpl: Tpl,
};
