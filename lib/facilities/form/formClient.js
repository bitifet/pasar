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
    function fldSet(target, path, value) {//{{{
        if (value === undefined) return;
        if (!(path instanceof Array)) path = path.split(".");
        var prop = path.shift();
        if (path.length) prop+= "["+path.join("][")+"]";
        if (target instanceof FormData) {
            target.set(prop, value);
        } else {
            target[prop] = value; // GET method uses plain objects.
        };
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
                    // Switch multiple with Shift+Ctrl-Click:
                    if (! fld.attr("title")) fld.attr("title", "Shift+Ctrl-Click to enable/disable multiple selection");
                    fld.on("click", function(ev){
                        if (ev.shiftKey && ev.ctrlKey) {
                            if (fld.attr("multiple")) {
                                fld.removeAttr("multiple");
                            } else {
                                fld.attr("multiple", "");
                            };
                            ev.preventDefault();
                        };
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

            var fld = $(this);

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

            return resetField;


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
        var submitBtn = $(".formButtons button.submit", form);
        var downloadBtn = $(".formButtons select.download", form);
        var resetBtn = $(".formButtons button.reset", form);

        function readForm(){ // Collect input data: //{{{

            var warns = {
                getFileUpload: [false, "File Upload is not supported for GET method. Do you want to send file name instead for testing purposes?"],
            };

            try {
                var targetFields = fields.not("[disabled]");

                var fdata = {}; // Use plain object by default.

                // Forms containing type="file" fields requires FormData.
                // ...but FormData sends multipart which is not supported by exprress-bodyparser
                // (so it requires express-fileupload middleware to be used).
                if (
                    method != 'get'
                    && targetFields.filter("[type=file]")           // Field inputs.
                        .filter(function(){return $(this).val()})   // With some file selected.
                        .length
                ) fdata = new FormData(); // Use FormData object.

                targetFields.each(function(){
                    var input = $(this);
                    var name = input.attr("name");
                    var type = input.data("type");
                    var multiple = input.attr("multiple");
                        // https://www.w3schools.com/tags/att_input_multiple.asp
                        // https://www.w3schools.com/tags/att_select_multiple.asp

                    var value = fldVal(input);
                    if (value === null) return; // Unfilled field.
                    switch(type) {
                    case "json":
                        if(value == "") {
                            value = "{}";
                            fldVal(input, value)
                        };
                        value = rJSON.parse(value);
                        break;
                    case "file":
                        value = input[0].files;
                        if (method == 'get') {
                            warns.getFileUpload[0] = true;
                            value = Array.prototype.map.call(value, x=>x.name);
                        };
                        if (! multiple) value = value[0];
                        break;
                    };
                    if (! name) {
                        fdata = value; // Override.
                    } else {
                        if (multiple) {
                            for (var i=0; i<value.length;i++) {
                                fldSet(fdata, name+"["+i+"]", value[i]);
                            };
                        } else {
                            fldSet(fdata, name, value);
                        };
                    };
                });
            } catch (err) {
                alert("ERROR: " + err);
                return;
            }; 
            for (var k in warns) {
                if (
                    warns[k][0]
                    && ! confirm ("WARNING: " + warns[k][1])
                ) return false;
            };
            return fdata;
        };//}}}

        function submitForm(){ //{{{

            var fdata = readForm();
            if (fdata === false) return;

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
            var sendOpts = {
                url: ".." + path + ".html", 
                type: method,
                success: function(data){
                    target
                        .html(data)
                        .removeClass("loading")
                    ;
                },
                data: fdata,
                error: function(err){
                    $("<p></p>")
                        .append($("<b>ERROR:</b>"))
                        .append($("<span></span>").text(err.responseText))
                        .appendTo(target)
                    ;
                    $("<code></code>").html(nl2br(JSON.stringify(err, null, 2))).appendTo(target);
                    target.removeClass("loading");
                },
            };
            if (fdata instanceof FormData) {
                sendOpts.processData = false;
                sendOpts.contentType = false;
            };
            $.ajax(sendOpts);

        }; //}}}

        function downloadForm(){//{{{

            var $this = $(this);
            var format = $this.val();
            var fdata = readForm();
            var url = ".." + path + "."+format;

            var form = $("<form></form>")
                .attr("action", url)
                .attr("method", method)
                .appendTo($("body"))
            ;

            for (var key in fdata) {
                $("<input type=\"hidden\" name=\""+key+"\"></input>")
                    .val(fdata[key])
                    .appendTo(form)
                ;
            };

            $this.val("");
            form.submit();

        };//}}}

        var resets = [];
        fields.each(function(){
            resets.push(enhanceField.call(this, form, submitForm));
        });

        submitBtn.on("click", submitForm);
        downloadBtn.on("change", downloadForm);

        resetBtn.on("click", function(){ //{{{
            resets.map(function(f){f();});
        }); //}}}

    });

})();
