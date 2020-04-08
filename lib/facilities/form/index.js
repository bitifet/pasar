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
const Url = require("url");
const Fs = require("fs");
const Pug = require("pug");
const Cfg = require("../../../cfg.js");
const Util = require("../../util.js");
const Path = require("path");

var defaultTemplate = Fs.readFileSync(__dirname+"/defaultFormTemplate.pug");

var Tpl = {//{{{
    item: Util.tpl(Path.resolve(__dirname, "formItem.pug")),
    index: Util.tpl(Path.resolve(__dirname, "formIndex.pug")),
};//}}}

function modelParser(prefs, spc, srvName, fName, fltIndex) {//{{{

    var forms = spc[fName];
    if ( // Make 'form' become shorthand for 'forms.all'.//{{{
        typeof forms != "object"
        || forms instanceof Array
    ) {
        forms = {all: forms};
    };//}}}
    for (var m in forms) { // Allow to define pug template as array of rows.//{{{
        if (forms[m] instanceof Array) {
            forms[m] = forms[m].join("\n") + "\n";
        } else if (typeof forms[m] == "string") {
            forms[m] = Util.smartPad(forms[m]);
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
                    tpl = Pug.compile(defaultTemplate)();
                    isDefault = true;
                } else {
                    if ((typeof tpl != "string") || ! tpl.length) throw "Wrong template";
                    tpl = Pug.compile(tpl)();
                };
            } catch (err) {
                tpl = Pug.compile(defaultTemplate)();
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
