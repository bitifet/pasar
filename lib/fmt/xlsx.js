// lib/fmt/xlsx.js
// ===============
"use strict";
// (Promise Aware Smart API Rest) generator.
//
// Tool to easily build Express-like routers with an Smart API REST facilites
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//

var j2xls = require('json2xls-xml')({ pretty : true });
var Util = require("../util.js");
 
function rowParse(input) {//{{{
    if (typeof input != "object") input = [input];
    var output = {};
    for (var i in input) {
        output[i] = Util.cellParse(input[i]);
    };
    return output;
};//}}}

module.exports = function buildXlsxParser(){

    function xlsxParser(input) {
        var data = input.data;

        // Data is threated as multiple named sheets by default.
        // But if it is an Array instance, then is supposed to be a single sheet.
        if (data instanceof Array) data = {sheet1: data};

        // Sanity checks:
        for (var sheet in data) {
            if (! (data[sheet] instanceof Array)) data[sheet] = Util.o2a(data[sheet]);
            data[sheet] = data[sheet].map(rowParse);
        };

        return {
            ctype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            data: j2xls(data),
        };

    };

    xlsxParser.help = "msExcel-xml (xlsx)";

    return xlsxParser;
};

