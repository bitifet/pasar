#!/usr/bin/env node
// minimal-demo.js
// ===============
//
// > PASAR (actually not) minimal functional demo.
//
// USAGE:
//    1. Copy this file to a (preferably empty) directory.
//    2. Execute following commands:
//      $ npm init                      # Optional (but recommended)
//      $ npm install --save express
//      $ npm install --save pasar
//      $ npm install --save body-parser
//      $ npm install --save express-fileupload
//    3. Execute:
//      $ node minimal-demo.js
//    4. Open your browser and type one of the following urls:
//      http://localhos:3000/api/form
//      http://localhos:3000/api/hello/form
//    5. Play... ;-)
//
"use strict"
const express = require('express');
const pasar = require("pasar");

const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const port = 3000;

const app = express();
app.listen(port, function () {
      console.log("Example app listening on port " + port + "!")
})


// Enables POST/PUT/DELETE requests (urlencoded).
// Requires bodyparser (npm install --save bodyparser)
app.use(bodyParser.urlencoded({ extended: false }));


// Enables JSON POST/PUT/DELETE requests:
// Requires bodyparser too.
app.use(bodyParser.json());

// Enables multipart POST/PUT/DELETE requests:
// Requires express-fileupload (npm install --save bodyparser)
//   | Only required if you need to accept multipart data  |
//   | (for example for 'type="file" inputs).              |
app.use(fileUpload());


const myApi = pasar({
    hello: {
        _all: function (prm) {
            console.log(prm);
            return new Promise(function(resolve, reject) {
                var result = {};
                for (var key in prm) {
                    result[key] = typeof prm[key];
                };
                resolve (result);
            });
        },
        form: {
            all: [
                'p',
                '  label Some text',
                '  input(type="text" name="textField")',
                'p',
                '  label Dropdown',
                '  select(name="dropdown")',
                '    option(value=1) Option 1',
                '    option(value=2) Option 2',
                '    option(value=3) Option 3',
                '    option(value=4) Option 4',
                'p',
                '  label Selectable',
                '  select(name="selectable" multiple)',
                '    option(value=1) Option 1',
                '    option(value=2) Option 2',
                '    option(value=3) Option 3',
                '    option(value=4) Option 4',
                'p',
                '  label Single file',
                '  input(type="file" name="singleFile")',
                'p',
                '  label Some files',
                '  input(type="file" name="multipleFiles" multiple)',
            ],
        },

    },

});

app.use('/api', myApi);

