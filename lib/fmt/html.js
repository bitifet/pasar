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

var defaultTemplate = [
    "- function useTable(obj){",
    "-   if(! (obj instanceof Array)) return false;",
    "-   if(obj.length < 1) return false;",
    "-   if(obj.length > 100000) return false;",
    "-   if(obj.length == 1) return true;",
    "-   var colNames = Object.keys(obj[0]);",
    "-   if (colNames.length > 15) return false;",
    "-   colNames = colNames.join(\";\");",
    "-   for(var row=0; row<obj.length; row++){",
    "-     if(typeof obj[row] != \"object\") return false;",
    "-     if(obj[row] instanceof Array) return false;",
    "-     if(Object.keys(obj[row]).join(\";\") != colNames) return false;",
    "-     for(var col in obj[row]){",
    "-       if (typeof obj[row][col] == \"object\") return false;",
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
    "              mixin parseObject(item)",
    "    else",
    "        span=obj",
    "",
    "mixin parseObject(data)",
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
