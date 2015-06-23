// PASAR - util.js
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
var Fs = require("fs");
var Path = require("path");
var Jade = require("jade");
var Cfg = require("./cfg.js");


var Util = {
    tpl: function tplCompile(tplPath) {//{{{
        var fullPath = Path.resolve(__dirname, "tpl/" + tplPath);
        return Jade.compile (
            Fs.readFileSync(fullPath)
            , {
                filename: fullPath,
                compileDebug: false,
            }
        );
    },//}}}
    txtCut: function txtCutter(txt, maxL) {//{{{
        if (txt.length > maxL) {
            return txt.substring(0, maxL) + "...";
        } else {
            return txt;
        };
    },//}}}
    nl2br: function nl2br(str, is_xhtml) { //  discuss at: http://phpjs.org/functions/nl2br///{{{
      // original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      // improved by: Philip Peterson
      // improved by: Onno Marsman
      // improved by: Atli Þór
      // improved by: Brett Zamir (http://brett-zamir.me)
      // improved by: Maximusya
      // bugfixed by: Onno Marsman
      // bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
      //    input by: Brett Zamir (http://brett-zamir.me)
      //   example 1: nl2br('Kevin\nvan\nZonneveld');
      //   returns 1: 'Kevin<br />\nvan<br />\nZonneveld'
      //   example 2: nl2br("\nOne\nTwo\n\nThree\n", false);
      //   returns 2: '<br>\nOne<br>\nTwo<br>\n<br>\nThree<br>\n'
      //   example 3: nl2br("\nOne\nTwo\n\nThree\n", true);
      //   returns 3: '<br />\nOne<br />\nTwo<br />\n<br />\nThree<br />\n'
      if (typeof str != "string" && ! (str instanceof String)) { // Become recursive://{{{
          if (str instanceof Array) {
              var out = [];
          } else {
              var out = {};
          };
          for (var i in str) out[i] = Util.nl2br(str[i]);
          return out;
      };//}}}
      var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display

      return (str + '')
        .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
    },//}}}
    hlpAutocomplete: function hlpAutocompleter(src, fnPath) {//{{{
        var hlp = src.help;

        if (typeof hlp == "string") {
            hlp = {contents: hlp};
        } else if (hlp === undefined) {
            hlp = {};
        };
        hlp.meta = src.meta;
        hlp.path = fnPath;

        if (! hlp.meta) hlp.meta = {};
        if (! hlp.contents) hlp.contents = "";

        if (! hlp.brief) hlp.brief = Util.txtCut(hlp.contents, Cfg.tplBriefLength);

        for (var i in hlp) {
            switch(i){
            // Text fields:
            case "brief":
                break;
            // Html fields:
            default:
                hlp[i] = Util.nl2br(hlp[i]);
            };
        };

        hlp.methods = (function (input) {//{{{
            var defText = (typeof input == "string" || input instanceof String)
                ? input
                : "(undocumented)"
            ;
            if (input === undefined) input = {};

            var output = {};

            // Sanityze and format:
            Object.keys(input).map(function(k) {
                var contents = input[k];
                if (k[0] == "_") k = k.substring(1); // Accept "_get" as "get".
                if (k == "all") {
                    defText = contents;
                } else {
                    var implemented = (typeof src["_" + k] == "function");
                    output[k] = {
                        description: contents,
                        implemented: implemented,
                    };
                };

            });

            // Autocomplete not explicitly documented methods:
            Cfg.validMethods
                .filter(function(k){
                    return (k != "all") // Not "all" wildcard.
                        && (output[k] === undefined) // Not explicitly documented.
                        && ( // Implemented:
                            (typeof src["_" + k] == "function") // Specifically.
                            || (typeof src["_all"] == "function") // Default implementation.
                        )
                    ;
                })
                .map(function(k){
                    output[k] = {
                        description: defText,
                        implemented: true,
                    };
                })
            ;

            return output;

        })(hlp.methods);//}}}

        return hlp;
    },//}}}
    sendStatusMessage: function sendStatusMessage(stName, msg) {//{{{
        var st = Cfg.statIdx[stName];
        if (st === undefined) {
            console.error("Wrong status name: " + stName);
            return res.status(Cfg.statIdx.error).send("Internal Server Error");
        } else return res.status(st).send(msg);
    },//}}}
};

module.exports=Util;
