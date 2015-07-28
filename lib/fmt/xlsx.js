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
// TODO: Migrate to 'xls' to support (implement those parsers) ods and old xls:
//      https://www.npmjs.com/package/xlsx
 
module.exports = function buildXlsxParser(){

    function xlsxParser(input) {
        var data = input.data;

        // Data is threated as multiple named sheets by default.
        // But if it is an Array instance, then is supposed to be a single sheet.
        if (data instanceof Array) data = {sheet1: data};

        return {
            ctype: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            data: j2xls(data),
        };

    };

    xlsxParser.help = "msExcel-xml (xlsx)";

    return xlsxParser;
};

