// /lib/fmt/html.js
// ================
// (Promise Aware Smart API Rest) generator.
//
// Tool to easily build Express-like routers with an Smart API REST facilites
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
"use strict";

var Jade = require("jade");
var Json2html = require("json2html").render;

function getTemplate(t) {
    if (t === undefined) return "";
    if (t instanceof Array) t = t.join("\n");
    try {
        return Jade.compileFile(t);
    } catch (f) {
        return Jade.compile(t);
    };
};

var defaultLayout = getTemplate([
    'doctype html',
    'html',
    '  head',
    '    title= title',
    '  body!= contents',
]);

module.exports = function(Opts){ // HTML output formatter: //{{{

    var layout = Opts.layout
        ? getTemplate(Opts.layout)
        : defaultLayout
    ;
            
    if (Opts.tpl) {
        var tpl = getTemplate(Opts.tpl);
        var htmlFilter = function htmlFilter(input) {
            return {
                ctype: "text/html",
                data: layout({
                    title: input.meta.title,
                    contents: tpl(input),
                })
            };
        };
    } else {
        var htmlFilter = function htmlFilter(input) {
            // FIXME: Implement default Jade templet to fully remove json2html
            // dependency.
            return {
                ctype: "text/html",
                data: layout({
                    title: input.meta.title,
                    contents: "<div id=\"j2h\">\n"
                        + Json2html(input.data)
                        + "</div>\n"
                })
            };
        };
    };

    htmlFilter.help = "Simple html formatter";
    return htmlFilter;
};//}}}
