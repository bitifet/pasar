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
var Url = require("url");
var Jade = require("jade");
var Cfg = require("./cfg.js");

var versionCheck = (function(){//{{{
    var nodeVersion = process.version.substring(1).split(".");
    function checkVersion (v, v0) {
        if (v0 === undefined) v0 = nodeVersion;
        if (!(v instanceof Array)) {
            v = v.substring(1).split(".");
        };
        var n = v.shift();
        var n0 = v0.shift();
        if (n > n0) return false;
        if (n < n0) return true;
        if (n == n0) return v.length
            ? checkVersion (v, v0)
            : true
        ;
    };
    return checkVersion;
})();//}}}

function mapMethods (//{{{
    src,
    input,
    defVal,
    cbk
) {
    defVal = (typeof input == "string" || input instanceof String)
        ? input
        : defVal
    ;
    if (input === undefined) input = {};
    if (cbk === undefined) {
        cbk = function(value, implemented, method) {
            return implemented ? value : undefined;
        };

    };

    var output = {};

    // Sanityze and format:
    Object.keys(input).map(function(k) {
        var contents = input[k];
        if (k[0] == "_") k = k.substring(1); // Accept "_get" as "get".
        if (k == "all") {
            defVal = contents;
        } else {
            var implemented = (typeof src["_" + k] == "function");
            var value = cbk(contents, implemented, k);
            if (value !== undefined) output[k] = value;
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
            var value = cbk(defVal, true, k);
            if (value !== undefined) output[k] = value;
        })
    ;

    return output;

};//}}}

var deasync = (function(){//{{{
    var requiredVersion = "v0.11.0";
    if (versionCheck(requiredVersion)) return require("deasync");
    return function noobDeasync(){
        return function(){
            throw "Sync functions are not supported in node versions earlier than " + requiredVersion;
        };
    };
})();//}}}

function propSet(target, path, value) {//{{{
    if (value === undefined) return;
    if (!(path instanceof Array)) path = path.split(".");
    var prop = path.shift();
    if (path.length) {
        if (target[prop] === undefined) target[prop] = {};
        propSet(target[prop], path, value);
    } else if (target[prop] === undefined) target[prop] = value;
};//}}}

function propGet(target, path) {//{{{
    if (!(path instanceof Array)) path = path.split(".");
    var prop = path.shift();
    if (path.length) {
        return target[prop] === undefined
            ? undefined
            : propGet(target[prop], path)
        ;
    } else return target[prop];
};//}}}

function propExpand(target) {//{{{
    for (var i in target) {
        if (i.match(/\./)) {
            propSet(target, i, target[i]);
            delete target[i];
        } else {
            if (typeof target[i] == "object") propExpand(target);
        };
    };
};//}}}

var Util = {
    buildPrefs: function applyDefaultPreferences(Options) {//{{{

        var prefs = {};
        propExpand(Options);

        // Sanityze options:
        if (Options === undefined) Options = {};

        // Accept all options as preferences:
        Object.keys(Options).filter(function(k){
            prefs[k] = Options[k];
        });

        // Define some extra default values:
        propSet(prefs, "client.jQuery", Cfg.paths.jQuery);

        return prefs;

    },//}}}
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
    hlpAutocomplete: function hlpAutocompleter(src, fnPath, prefs) {//{{{
        var hlp = src.help;

        if (typeof hlp == "string") {
            hlp = {contents: hlp};
        } else if (hlp === undefined) {
            hlp = {};
        };
        hlp.meta = src.meta;
        hlp.path = fnPath;
        hlp.prefs = prefs.client;

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


        hlp.methods = mapMethods (//{{{
            src,
            hlp.methods,
            "(undocumented)",
            function expandMethodHelp(value, implemented) {
                return {
                    description: value,
                    implemented: implemented,
                };
            }
        );//}}}


        propSet(hlp, "examples", propGet(prefs, "defaults.help.examples")); // Get defaults.

        hlp.examples = mapMethods (//{{{
            src,
            hlp.examples,
            undefined,
            function expandMethodExamples(input, implemented, method) {
                if (input === undefined) return;
                var output = [];
                for (var i in input) {
                    if (input[i] instanceof Array) {
                        var lbl = input[i][0];
                        var prm = input[i][1];
                        var comments = input[i][2];
                    } else {
                        var prm = input[i];
                        var comments = '';
                    };
                    var url = method == "get"
                        ? Url.format({
                            pathname: ".." + hlp.path,
                            query: prm,
                        })
                        : "#"
                    ;
                    if (typeof lbl === "object" || ! lbl) lbl = url.substring(2);

                    output.push({
                        method: method,
                        label: lbl,
                        prm: prm,
                        comments: comments,
                        url: url,
                    });
                };
                return output;
            }
        );//}}}

        return hlp;
    },//}}}
    sendStatusMessage: function sendStatusMessage(res, stName, msg) {//{{{
        var st = Cfg.statIdx[stName];
        if (st === undefined) {
            console.error("Wrong status name: " + stName);
            return res.status(Cfg.statIdx.error).send("Internal Server Error");
        } else return res.status(st).send(msg);
    },//}}}
    depromise: function deasyncPromise(p) { //{{{
        return deasync(function (input, cbk) {
            if (typeof input == "function" && (cbk === undefined)) {
                cbk = input;
                input = {};
            };
            p(input)
                .then(function(output){
                    cbk(false, output);
                })
                .catch(function(err){
                    cbk(err);
                })
            ;
        });
    },//}}}
};

module.exports=Util;
