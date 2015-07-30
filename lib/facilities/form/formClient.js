var rJSON = { //{{{
    parse: function relaxedJSONparse(input){
        var output;
        var firewall = "var " + ( // Minimal code injection protection: //{{{
            ["window", "document", "Object", "Array" , "String", "$"
                , "Function", "Boolean", "Symbol"
                , "Math", "Infinity", "RegExp"
                , "Number", "Date", "JSON"
                , "isFinite", "isNaN", "parseFloat", "parseInt"
                , "NaN", "undefined" , "eval", "uneval"
                , "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent"
                , "escape", "unescape"
                , "Error", "EvalError", "InternalError", "RangeError", "ReferenceError"
                , "SyntaxError", "TypeError", "URIError"
                , "Map", "Set", "WeakMap", "WeakSet"
                , "Int8Array", "Uint8Array", "Uint8ClampedArray"
                , "Int16Array", "Uint16Array", "Int32Array"
                , "Uint32Array", "Float32Array", "Float64Array"
                , "SIMD", "Intl", "ArrayBuffer", "DataView"
                , "Promise", "Generator", "GeneratorFunction"
                , "Reflect", "Proxy", "arguments"
                , "Iterator", "ParallelArray", "StopIteration"
            ]
            .concat(Object.keys(window))
            .concat(Object.keys(document))
        ).join(", ") + ";\n"; //}}}
        // BTW, no client-side hack could achieve anything that our API funtion doesn't allow.
        eval (firewall + 'output=' + input); // Suboptimal but convenient.
        return output;
    },
}; //}}}
(function(){
"use strict"
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
        if (target === undefined || path === undefined) return target;
        if (!(path instanceof Array)) path = path.split(".");
        var prop = path.shift();
        if (! prop) return target;
        if (path.length) {
            return target[prop] === undefined
                ? undefined
                : propGet(target[prop], path)
            ;
        } else return target[prop];
    };//}}}
    function nl2br(str) { //{{{
      return (str + '')
        .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1<br />$2');
    };//}}}
    function fldVal(f, value){//{{{
        var v = f.data("getset")
        v || (v = f.val);
        return value === undefined ? v.call(f) : v.call(f, value);
    };//}}}
    var fieldEnhancement = (function(){//{{{
        function setDefVal(f){//{{{
            var v = f.attr("value");
            if (v === undefined) v = fldVal(f);
            f.data("default", v);
        };//}}}
        function getFieldType(f){//{{{
            var type = f.attr("type");
            if (
                ! type
                && f[0].tagName == "SELECT"
            ) type = "select";
            if (! type) type = "json";
            f.data("type", type);
            return type;
        };//}}}
        var typeEnhancements = {//{{{
            epochdate: function(f){//{{{
                f.data("getset", function newVal(value) {
                    if (value !== undefined) {
                        value = new Date(value);
                    };
                    return value === undefined
                        ? (new Date(f.val())).getTime()
                        : f.val(value)
                    ;
                });
                f.attr("type", "date");
            },//}}}
            select: (function selectEnhancenments() {//{{{
                function filterResults(r, keyFld, valueFld) {//{{{

                    var map = {};
                    if (keyFld !== undefined) {
                        for (var i in r) map[r[i][keyFld]] = r[i];
                    } else map = r;

                    if (valueFld !== undefined) {
                        for (var k in map) map[k] = map[k][valueFld]+" ("+k+")";
                    } else {
                        for (var k in map) {
                            map[k] = typeof map[k] == "string"
                                ? map[k]+" ("+k+")"
                                : map[k][Object.keys(map[k])[0]]
                            ;
                        }
                    };
                    return map;
                };//}}}
                function expandOptions(target) {//{{{
                    var url = target.data("from");
                    if (! url) return;
                    if (! url.match(/^(http|ftp):\/\//)) { // Respect full-path urls:
                        url = "../" + url;
                    };


                    var method = propGet(target.data("method"), "", "get");
                    var query = propGet(target.data("query"), "", {});
                    var dataPath = propGet(target.data("path"), "");
                    var keyName = propGet(target.data("key"), "");
                    var valueName = propGet(target.data("value"), "");


                    $.ajax({
                        url,
                        type: method,
                        success: function(data){
                            var map = filterResults(
                                propGet(data, dataPath)
                                , keyName
                                , valueName
                            );
                            var cursor = target;
                            for (var k in map) {
                                var opt = $("<option>")
                                    .attr("value", k)
                                    .text(map[k])
                                ;
                                cursor.after(opt);
                                cursor = opt;
                            };
                            target.remove();
                        },
                        data: query,
                        error: function(err){
                            alert(err);
                        },
                    });
                };//}}}
                return function enhanceSelect(f){
                    $("option", f).each(function(){
                        var o = $(this);
                        expandOptions(o);
                    });
                };
            })(),//}}}
        };//}}}
        return function enhanceField(){//{{{
            var f = $(this);
            var type = getFieldType(f);
            if (typeEnhancements[type]) typeEnhancements[type](f);
            setDefVal(f);
            var fswitch = $("<input type=\"checkbox\"></input>")
                .insertBefore(f);
            if (! f.attr("disabled")) fswitch.attr("checked", "checked");
            fswitch.on("change", function(){
                if (fswitch.is(":checked")) {
                    f.removeAttr("disabled");
                } else {
                    f.attr("disabled", "disabled");
                };
            });
        };//}}}
    })();//}}}
    var container = $("div#results");
    var clearBtn = $("button#clearResults")
    clearBtn.on("click", function(){//{{{
        container.html("");
        clearBtn.hide();
    });//}}}
    $("div.form").each(function(){
        var form = $(this);
        var method = form.data("method");
        var path = form.data("path");
        var fields = $(".fields :input", form);
        var submitBtn = $(".controls button.submit", form);
        var resetBtn = $(".controls button.reset", form);

        fields.each(fieldEnhancement);
        submitBtn.on("click", function(){ //{{{

            var data = {}; // Collect input data: //{{{
            try {
                fields.not("[disabled]").each(function(){
                    var input = $(this);
                    var name = input.attr("name");
                    var type = input.data("type");
                    var value = fldVal(input);
                    switch(type) {
                    case "json":
                        if(value == "") {
                            value = "{}";
                            fldVal(input, value)
                        };
                        value = rJSON.parse(value);

                    };
                    if (! name) {
                        data = value;
                    } else {
                        propSet(data, name, value);
                    };
                });
            } catch (err) {
                alert("ERROR: " + err);
                return;
            }; //}}}



            // Flush results container:
            container.html("");
            clearBtn.show();

            // Build new fresh result target (avoids "request races"):
            var target = $("<div></div>")
                .addClass("loading")
                .appendTo(container)
            ;
            $("<p>Requesting data from API...</p>").appendTo(target);


            // Perform request:
            $.ajax({
                url: ".." + path + ".html", 
                type: method,
                success: function(data){
                    target
                        .html(data)
                        .removeClass("loading")
                    ;
                },
                data: data,
                error: function(err){
                    $("<p></p>")
                        .append($("<b>ERROR:</b>"))
                        .append($("<span></span>").text(err.responseText))
                        .appendTo(target)
                    ;
                    $("<code></code>").html(nl2br(JSON.stringify(err, null, 2))).appendTo(target);
                    target.removeClass("loading");
                },
            });

        }); //}}}
        resetBtn.on("click", function(){ //{{{
            fields.each(function(){
                var f = $(this);
                fldVal(f, f.data("default"));
            });
        }); //}}}

    });
})();
