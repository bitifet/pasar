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

const Pug = require("pug");

function getTemplate(t) {
    if (t === undefined) return "";
    if (t instanceof Array) t = t.join("\n");
    try {
        return Pug.compileFile(t);
    } catch (f) {
        return Pug.compile(t);
    };
};

var defaultLayout = getTemplate([
    'doctype html',
    'html',
    '  head',
    '    title= title',
    '  body!= contents',
]);

var defaultTemplate = [
    "- function useTable(obj){",
    "-   if(! (obj instanceof Array)) return false;",
    "-   if(obj.length < 1) return false;",
    "-   if(obj.length > 100000) return false;",
    "-   if(obj.length == 1) return true;",
    "-   var colNames = Object.keys(obj[0]);",
    "-   if (colNames.length > 50) return false;",
    "-   var colIdx = {};",
    "-   for (var i=0; i<colNames.length; i++) {",
    "-     colIdx[colNames[i]] = true;",
    "-   };",
    "-   for(var row=0; row<obj.length; row++){",
    "-     if(typeof obj[row] != \"object\") return false;",
    "-     if(obj[row] instanceof Array) return false;",
    "-     for(var col in obj[row]){",
    "-       if (! colIdx[col]) return false;",
    "-       if ((typeof obj[row][col] == \"object\") && obj[row][col] !== null) return false;",
    "-     };",
    "-   };",
    "-   return true;",
    "- };",
    "",
    "mixin parseObject(obj)",
    "  if (! obj)",
    "    span",
    "  else",
    "    if (typeof obj == \"object\")",
    "      if (useTable(obj))",
    "        table",
    "          tr",
    "            each ColName in Object.keys(obj[0])",
    "              th=ColName",
    "          each row in obj",
    "            tr",
    "              each col in row",
    "                td=col",
    "      else",
    "        ul",
    "          each item, key in obj",
    "            li",
    "              b #{key}:",
    "              +parseObject(item)",
    "    else",
    "        span=obj",
    "",
    "  style.",
    "    table tr th {",
    "      background-color: #cccccc;",
    "    }",
    "    table tr:nth-child(odd) {",
    "      background-color: #eeeeee;",
    "    }",
    "    table tr:nth-child(even) {",
    "      background-color: #ffffff;",
    "    }",
    "br",
    "br",
    "+parseObject(data)",
].join("\n");





module.exports = function(Opts){ // HTML output formatter: //{{{

    var layout = Opts.layout
        ? getTemplate(Opts.layout)
        : defaultLayout
    ;
    var tpl = Opts.tpl
        ? getTemplate(Opts.tpl)
        : getTemplate(defaultTemplate)
    ;
            
    var htmlFilter = function htmlFilter(input, runtimeOptions) {
        return {
            ctype: "text/html",
            data: runtimeOptions.xhr
                ? tpl(input)
                : layout({
                    title: input.meta.title,
                    contents: tpl(input),
                })
            ,
        };
    };

    htmlFilter.help = "Simple html formatter";
    return htmlFilter;
};//}}}
