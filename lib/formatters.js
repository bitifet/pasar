// PASAR - formatters.js
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
var Parsers = {
    html: require("json2html").render,
};
module.exports = { // Filter implementations:
    raw: function jsonFilter(input){ // Raw output formatter://{{{
        return {
            ctype: "application/json",
            data: input
        };
    },//}}}
    json: function jsonFilter(input){ // JSON (default) output formatter://{{{
        return {
            ctype: "application/json",
            data: input.data
        };
    },//}}}
    html: function htmlFilter(input){ // HTML output formatter: //{{{
        return {
            ctype: "text/html",
            data: "<Doctype html>\n"
                + "<html>\n"
                + "<head>\n"
                + "<title>\n"
                + input.meta.title
                + "</title>\n"
                + "</head>\n"
                + "<body>\n"
                + "<div id=\"j2h\">\n"
                + Parsers.html(input.data)
                + "</div>\n"
                + "</body>\n"
                + "</html>\n"
            ,
        };
    },//}}}
}
