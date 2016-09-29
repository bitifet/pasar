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
var Cfg = require("../cfg.js");

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

var deasync = (function(){//{{{
    var requiredVersion = "v0.11.0";
    if (versionCheck(requiredVersion)) return require("deasync");
    return function noobDeasync(){
        return function(){
            throw "Sync functions are not supported in node versions earlier than " + requiredVersion;
        };
    };
})();//}}}


var Util = {
    duckFn: function functionDuck(duck) {return typeof duck == "function";},
    dumbFn: function (input) {return input;},
    propSet: function propSet(target, path, value) {//{{{
        if (value === undefined) return;
        if (!(path instanceof Array)) path = path.split(".");
        var prop = path.shift();
        if (path.length) {
            if (target[prop] === undefined) target[prop] = {};
            propSet(target[prop], path, value);
        } else if (target[prop] === undefined) target[prop] = value;
    },//}}}
    propGet: function propGet(target, path) {//{{{
        if (target === undefined || path === undefined) return target;
        if (!(path instanceof Array)) path = path.split(".");
        var prop = path.shift();
        if (path.length) {
            return target[prop] === undefined
                ? undefined
                : propGet(target[prop], path)
            ;
        } else return target[prop];
    },//}}}
    propExpand: function propExpand(target) {//{{{
        for (var i in target) {
            if (i.match(/\./)) {
                Util.propSet(target, i, target[i]);
                delete target[i];
            } else {
                if (typeof target[i] == "object") propExpand(target[i]);
            };
        };
    },//}}}
    mapMethods: function mapMethods (//{{{
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
            var isDefault = false;
            if (k[0] == "_") k = k.substring(1); // Accept "_get" as "get".
            if (k == "all") {
                defVal = contents;
            } else {
                var implemented = (typeof src["_" + k] == "function");
                var value = cbk(contents, implemented, k, isDefault);
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
                var value = cbk(defVal, true, k, false);
                if (value !== undefined) output[k] = value;
            })
        ;

        return output;

    },//}}}
    tpl: function tplCompile(tplPath) {//{{{
        return Jade.compile (
            Fs.readFileSync(tplPath)
            , {
                filename: tplPath,
                compileDebug: false,
            }
        );
    },//}}}
    pick: function pickFirstDefined(candidates, duckFn) {//{{{
        if (typeof duckFn != "function") { // Default duck typing.//{{{
            duckFn = function(){return true;}; // Dumb duck.
        };//}}}
        for (
            var i in candidates
        ) {
            var target = Util.propGet(candidates[i][0], candidates[i][1]);
            if ((target === undefined) || ! duckFn(target)) continue;
            return target;
        };
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
    sendStatusMessage: function sendStatusMessage(res, stName, msg) {//{{{
        if ((msg instanceof Object) && typeof msg.toString == "function") msg = msg.toString();
        var st = Cfg.statIdx[stName];
        if (st === undefined) {
            return res.status(Cfg.statIdx.error).send("Internal Server Error");
        } else {
            return res.status(st).send(msg);
        };
    },//}}}
    flag: function setFlag(target, key) {//{{{
        target[key] = true;
        return target;
    },//}}}
    oMap: function objectMapper(input, fn) {//{{{
        var output = {};
        if (typeof fn != "function") { // Optimal constant mapper.
            for (var k in input) output[k] = fn;
        } else {
            for (var k in input) output[k] = fn(input[k], k);
        };
        return output;
    },//}}}
    oExtend: function objectExtender(objects) {//{{{
        var target = objects.shift();
        while(objects.length) {
            var patch = objects.shift();
            for (var k in patch) target[k] = patch[k];
        };
        return target;
    },//}}}
    o2a: function o2a(input) {//{{{
        if (input === undefined) return [];
        if (typeof input != "object") return [input];
        return Object.keys(input).map(function(key){
            var target = input[key];
            if (target === undefined) target = {};
            if (typeof target != "object") target = [target];
            var item = {"": key};
            for (var i in Object.keys(target)) item[i] = target[i];
            return item;
        });
    },//}}}
    cellParse: function cellParse(input) {//{{{
        if (input === undefined) return "";
        if (typeof input == "object") {
            if (input instanceof Date) {
                return input.toString();
            } else {
                return JSON.stringify(input);
            };
        };
        return input;
    },//}}}
};

module.exports=Util;
