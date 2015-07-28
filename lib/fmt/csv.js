// lib/fmt/csv.js
// ==============
"use strict";

function parseCell(text) {//{{{
    if (text === undefined) return "";
    return String(text).replace(/"/g, '\"');
};//}}}
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
        reg[header.index[key]] = parseCell(data[key]);
    };

    return '"' + reg.join('";"') + '"\n';
};//}}}
function renderHeader(header) {//{{{
    var h = {};
    var keys = Object.keys(header.index);
    for (var i in keys) {
        h[keys[i]] = keys[i];
    };
    return formatRow(header, h);
};//}}}

module.exports = function buildCsvParser(){

    function csvParser(input) {
        var data = input.data;
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
