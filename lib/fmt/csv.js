// lib/fmt/csv.js
// ==============
// (Promise Aware Smart API Rest) generator.
//
// Tool to easily build Express-like routers with an Smart API REST facilites
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
"use strict";

var Util = require("../util.js");

module.exports = function buildCsvParser(Options){

    var separator = Options.separator ? Options.separator : ',';
    var quoting = Options.quoting ? Options.quoting : '"';
    var prefs = {
        separator: separator,
        quoting: quoting,
        cellParse: [new RegExp(separator, 'g'), "\\" + separator],
    };

    function updateHeader (header, data) {//{{{
        var keys = Object.keys(data);
        for (var i in keys) {;
            var k = keys[i];
            if (header.index[k] === undefined) header.index[k] = header.c++;
        };
    };//}}}
    function formatRow (header, data) {//{{{
        var reg = [];
        for (var key in header.index) {
            reg[header.index[key]] = String(
                    Util.cellParse(data[key])
            ).replace(
                prefs.cellParse[0]
                , prefs.cellParse[1]
            );
        };

        return prefs.quoting
            + reg.join(
                prefs.quoting
                + prefs.separator
                + prefs.quoting
            )
            + prefs.quoting
            + "\n"
        ;
    };//}}}
    function renderHeader(header) {//{{{
        var h = {};
        var keys = Object.keys(header.index);
        for (var i in keys) {
            h[keys[i]] = keys[i];
        };
        return formatRow(header, h);
    };//}}}

    function csvParser(input) {
        var data = input.data;
        if (! (data instanceof Array)) data = Util.o2a(data);

        if (! data.length) return "";
        var header = {
            c: 0,
            index: {},
        };
        var output = "";

        for (var i in data) {
            updateHeader(header, data[i]);
            output += formatRow(header, data[i]);
        };

        return {
            ctype: "text/csv",
            data: renderHeader(header)+output,
        };

    };

    csvParser.help = "Colon separated text";

    return csvParser;
};
