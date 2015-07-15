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
var Util = require("./util.js");

var Parsers = {
    html: require("json2html").render,
};


// Output filter template:
// -----------------------
//
// var myOutputFilterConstructor = function(setupOptions) {
//
//     // Some setup...
//
//     function myOutputFilter ( // Actual output filter.
//         input // {data: _actual_input_data_, meta: _some_metadata_}
//         //, runtimeOptions // Usually will be {} (ignore it except if you need).
//     ) {
//         // Do some transformations:
//         return {
//              ctype: _content_type_string_,
//              data: _resulting_output_
//          };
//     }
//
//     // If you REALLY want to change your filter behaviour depending on request
//     // data, you should define requestMapper property over your output filter
//     // like this:
//     // myOutputFilter.requestMapper(req) {
//     //    // Do something.
//     //    return _resulting_runtimeOptions_;
//     // };
//
//     return myOutputFilter;
// };
//
// -----------------------



// Core filter implementations:
var coreFilters = {
    raw: function(){return function jsonFilter(input){ // Raw output formatter://{{{
        return {
            ctype: "application/json",
            data: input
        };
    }},//}}}
    json: function(opt){return function jsonFilter(input){ // JSON (default) output formatter://{{{
        return {
            ctype: "application/json",
            data: input.data
        };
    }},//}}}
    html: function(){return function htmlFilter(input){ // HTML output formatter: //{{{
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
    }},//}}}
}

// More formatters:
// As they become complex, format filters can be isolated as its own modules:
// Ex.: coreFilters.csv = require("./fmt/csv.js");


function wrapFilter (flt, Options) {//{{{
    return function(input, runtimeOptions) {
        // NOTE: Filters options are expected to be defined at stup time.
        // ...but, if needed, runtime filter options can be mapped thought
        // custom request mapper.
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
        return flt(output, runtimeOptions);
    };
};//}}}

function loadFilters (target, items) {//{{{
    if (items === undefined) { // loadFilters(items) creates new fresh filters object.//{{{
        items = target;
        target = {};
    };//}}}
    if (items === undefined) { // loadFilters() creates new fresh filters with all native filtes.
        items = {};
        Object.keys(coreFilters).map(function(ext) {
            items[ext] = [ext, {}];
        });
    };
    // Items = {
    //    ext: fltSpec, // "File" extension / filter specs.
    //           // Valid filter specs:
    //           //      [String, Object]:   Filter name, Constructor options.
    //           //      [Function, Object]: Filter Constructor, Constructor options.
    //           //      String:             Shorthand for [String, {}].
    //           //      Function:           Shorthand for [Function, {}].
    //           //      Object:             Shorthand for [ext, Object].
    //           //      [Str/Fn, String]:   Shorthand for [Str/Fn, {String: true}].
    //           //      Boolean false:      Disables filter.
    //    [...]
    // }
    var filters = {};
    for (var ext in target) filters[ext] = target[ext];
    for (var ext in items) {
        var flt = items[ext];
        // Handle shorthands and disabling function.//{{{
        if (items[ext] === false) { // Disabling function.
            delete (target[ext]);
            continue;
        } else if (
            typeof flt == "string"
            || typeof flt == "function"
        ) {
            flt = [flt, {}];
        } else if (
            !(flt instanceof Array)
        ) {
            flt = [ext, flt]; // Filter name is pointed by extension.
        };//}}}
        if (typeof flt[0] == "string") flt[0] = coreFilters[flt[0]];
        if (typeof flt[0] != "function") {
            console.error("PASAR: Wrong output filter: " + flt);
            continue;
        };
        if (typeof flt[1] == "string") flt[1] = Util.flag({}, flt[1]);
        filters[ext] = wrapFilter(
            new flt[0](flt[1]) // Call constructor with given options.
        );
    };
    return filters;
};//}}}

// --------------------------------------------------------------------

module.exports = loadFilters({}, coreFilters);


///module.exports = {
    ///filters: coreFilters,
    ///load: loadFilters,
///};


