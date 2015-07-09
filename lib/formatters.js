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

// Core filter implementations:
var fmt = {
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

// More formatters:
// As they become complex, format filters can be isolated as its own modules:
// Ex.: fmt.csv = require("./fmt/csv.js");


// --------------------------------------------------------------------
module.exports = ( // Wrap common input checkins wrapping: //{{{
    function (src) {
        var flt = {};
        Object.keys(src).map(function wrapFixations(fltName) {
            flt[fltName] = function(input) {
                var output = {};
                if (input !== undefined) {
                    if (input.data === undefined) {
                        // Accept result without data/metadata separation when
                        // there is no metadata to pass thought.
                        // (Only if no data vector present)
                        output.data = input;
                    } else {
                        output = input;
                    };
                    if (output.meta === undefined) output.meta = {};
                };
                return src[fltName](output);
            };
        });
        return flt;
    }
)(fmt);//}}}

