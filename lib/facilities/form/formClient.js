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
    function propGet(target, path, defVal) {//{{{
        if (target === undefined) target = defVal;
        if (path === undefined) return target;
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
    function fldVal(fld, value){//{{{
        var v = fld.data("getset")
        v || (v = fld.val);
        return value === undefined ? v.call(fld) : v.call(fld, value);
    };//}}}
    var enhanceField = (function(){//{{{
        function getFieldType(fld){//{{{
            var type = fld.attr("type");
            if (
                ! type
                && fld[0].tagName == "SELECT"
            ) type = "select";
            if (! type) type = "json";
            fld.data("type", type);
            return type;
        };//}}}
        var typeEnhancements = {//{{{
            epochdate: function(fld){//{{{
                // Add date format information://{{{
                var ph = fld.attr("placeholder");
                var tt = fld.attr("title");
                fld.attr(
                    "placeholder"
                    , "yyyy-mm-dd" + (ph ? " - " + ph : "")
                );
                fld.attr(
                    "title"
                    , "[RFC 3339]" + (tt ? " - " + tt : "")
                );//}}}
                fld.data("getset", function newVal(value) {//{{{
                    if (value !== undefined) {
                        value = new Date(value);
                    };
                    return value === undefined
                        ? (new Date(fld.val())).getTime()
                        : fld.val(value)
                    ;
                });//}}}
                fld.attr("type", "date");
            },//}}}
            select: (function selectEnhancenments() {//{{{
                function filterResults(r, keyFld, valueFld, keys) {//{{{

                    // Index by identifier:
                    var idx = {};
                    if (keyFld !== undefined) {
                        for (var i in r) idx[r[i][keyFld]] = r[i];
                    } else idx = r;

                    var out = {};
                    for (var k in idx) {
                        out[k] = {
                            // Pick for description:
                            label: valueFld
                                ? valueFld
                                    .map(function(c){return idx[k][c];})
                                    .join(" - ")
                                    +" ("+k+")"
                                : typeof idx[k] == "string"
                                    ? idx[k]+" ("+k+")"
                                    : idx[k][Object.keys(idx[k])[0]]
                            ,
                            // Pick for optional foreign keys:
                            keys: keys.map(function(fk){
                                return [
                                    fk[0],        // Respect foreign field name.
                                    idx[k][fk[1]], // Replace requested value.
                                ];
                            }),
                        };
                    };
                    return out;
                };//}}}
                function expandOptions(target) {//{{{

                    var field = target.closest("select");

                    // Url handling://{{{
                    var url = target.data("from");
                    if (! url) return;
                    if (! url.match(/^(http|ftp):\/\//)) { // Respect full-path urls:
                        url = "../" + url;
                    };
                    //}}}

                    // Parametization handling://{{{
                    var method = propGet(target.data("method"), "", "get");
                    var query = propGet(target.data("query"), "", {});
                    var dataPath = propGet(target.data("path"), "");
                    var keyName = propGet(target.data("key"), "");
                    var valueName = propGet(target.data("value"), "", "").split("+"); // Accept multiple ("+")
                    var keys = propGet(target.data("fkeys"), "", "")
                        .split(",") // Accept multiple (",")
                        .filter(function(v){return v;})
                        .map(function(constraint){ // forignField=columnName
                            return [
                                constraint.split("=",1)[0], // Foreign field name.
                                constraint.substring(constraint.indexOf("=")+1), // Matching column name.
                            ];
                        })
                    ;
                    //}}}

                    // Load data://{{{
                    $.ajax({
                        url,
                        type: method,
                        success: function(data){
                            var map = filterResults(
                                propGet(data, dataPath)
                                , keyName
                                , valueName
                                , keys
                            );
                            var cursor = target;
                            for (var k in map) {
                                var opt = $("<option>")
                                    .attr("value", k)
                                    .text(map[k].label)
                                ;
                                map[k].keys.filter(function(fk){
                                    opt.data("fk_"+fk[0], fk[1]);
                                });
                                cursor.after(opt);
                                cursor = opt;
                            };
                            target.remove();
                        },
                        data: query,
                        error: function(err){
                            alert(err);
                        },
                    });//}}}

                    // Annotate trigger definitions:
                    field.data("triggers", keys);

                };//}}}
                return function enhanceSelect(fld, form){
                    $("option", fld).each(function(){
                        var o = $(this);
                        expandOptions(o);
                    });
                    // Enhance triggers:
                    var triggers = fld.data("triggers");
                    if (triggers) triggers.map(function(t){ // Closure)
                        var target = $("*[name=\""+t[0]+"\"]", form);
                        var tgKey = "fk_"+t[1];
                        target.on("change", function(ev){
                            var options = $("option", fld); // (all, including dynamic)
                            // FIXME: Better cached, but requires promises client side ;-).
                            var val = target.val();
                            if (val) {
                                options.each(function(){
                                    var op = $(this);
                                    var opKey = op.data(tgKey);
                                    if (opKey == val) {
                                        op.show();
                                        op.removeAttr("disabled");
                                    } else if (opKey !== undefined) {
                                        op.hide();
                                        op.removeProp("selected");
                                        op.attr("disabled", "disabled");
                                    };
                                });
                            } else {
                                options.show();
                            }
                        });
                    });
                };
            })(),//}}}
        };//}}}
        return function fieldEnhancement(form, submitFn){//{{{
            (function doEnhance(fld){

                function updateSwitch(){//{{{
                    if (fswitch.is(":checked")) {
                        fld.removeAttr("disabled");
                    } else {
                        fld.attr("disabled", "disabled");
                    };
                };//}}}

                function resetField(){//{{{
                    fld.val(defVals.value);
                    if (defVals.disabled) {
                        fswitch.removeAttr("checked");
                    } else {
                        fswitch.attr("checked", "checked");
                    };
                    updateSwitch();
                };//}}}

                var type = getFieldType(fld);
                if (typeEnhancements[type]) typeEnhancements[type](fld, form);
                var fswitch = $("<input type=\"checkbox\"></input>")
                    .insertBefore(fld);

                var defVals = {
                    value: (function(){
                        var v = fld.attr("value");
                        return v ? v : null;
                    })(),
                    disabled: (
                        fld.attr("disabled")     // "disabled" attribute.
                        || fld.data("disabled")  // Let to alternatively use "data-disabled"
                                                 // to override browser's reload cache.
                    ) ? true: false,
                };

                resetField();

                fld.on("reset", resetField);
                fswitch.on("change", updateSwitch);

                if (fld.data("autosubmit")){ // Submit on "enter" or change event for selects.
                    fld.on("keypress change", function(ev) {
                        if (
                            ev.type == "change" && ev.target.nodeName == "SELECT"
                            || (ev.keyCode || ev.which) == 13
                        ) submitFn();
                    });
                };

            })($(this));

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

        function submitForm(){ //{{{

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

        }; //}}}

        fields.each(function(){
            enhanceField.call(this, form, submitForm);
        });


        submitBtn.on("click", submitForm);

        resetBtn.on("click", function(){ //{{{

            fields.each(function(){
                $(this).trigger("reset");
            });

        }); //}}}

    });

})();
