PASAR
=====

Promise Aware Smart API Rest builder.

Let's to easily build Express routers with an Smart API REST facilites.

Features:
---------

(Not all of themimplemented yet)

  * Easy method (GET, POST, etc...) attachment handling.

  * Multiple output formats selected by extension (default is .json). Including html (to easy data inspection).
    - .json
    - .html
    - .csv
    - (more comming soon...)

  * Easy access to self explanation (adding '/help' to each url) and fully automated help index.

  * Internally reusable: API function implementation can easily make use of other functions.

  * Input and Output (TODO) mapping functions.

  * Easy testing witn automated (but customizable) '/form' views. (TODO)

  * Global access control policies, including restriction to some functionalities like /help, etc... (TODO)

  * Configurable logging capabilites (including time measurement). (TODO)

  * Global, per-api and per-function configurable timeouts (via promise rejection). (TODO)

  * Promise-level caching. (TODO)


Example:
--------

To build a new API REST simply:

```javascript
    var Express = require('express');
    var Router = Express.Router();
    var pAPI = require("pasar");

    // Load API definitions:
    var someAPI = require("__path_to_my_api__");
    var someOtherAPI = require("__path_to_my_api__");

    // To mount your api at /api route:
    Router.use('/api', pAPI(someAPI));

    // To mount your api at your router root:
    Router.use(pAPI(someOtherAPI));
```


All API definitions should look's like follows:


```javascript
    var Promise = require("promise"); // Or your favorite promise library.

    module.exports = {
        someFunction: {
            _get: function(input) {
                // Do some stuff...
                return new Promise(function(resolve, reject) {
                        // Do some async stuff...
                        // And somewhere:
                        resolve({
                            data: {...}, // Actual function response.
                            meta: {...}, // Some optional metadata which could be used by many output filteres.
                                        // i.e. page title, field types, etc...
                        });
                        // And in some other place:
                        reject(error);
                });
            },
            _post: function(input) {
                // ...
            },
            help: {
                contents: "Explain what this function does...",
                brief: "Brief explanation to be shown in whole API help index",
                    // If not given, brief will be auto-extracted from contents.
                methods: {
                    'all': "Method specific explanation", // Default text. I ommitted, defaults to "(Undocumented)".
                    '_get": "Specific explanation for GET method", // 'get' and '_get' are threated the same.
                    // 'post': "", // As commented out, it will default to "all" text.
                    'put': "Some future method explanation.", // Will be marked as "UNIMPLEMENTD".
                    // 'delete': "", // As commented out and unimplemented, will NOT be shown.
                }
            },
        },
        someOtherFunction: {
            _all: function(input) {
                // Do some stuff...
                return new Promise(function(resolve, reject) {
                        // Do some async stuff...
                        // And somewhere:
                        resolve({
                            data: {...}, // Actual function response.
                            meta: {...}, // Some optional metadata which could be used by many output filteres.
                                        // i.e. page title, field types, etc...
                        });
                        // And in some other place:
                        reject(error);
                });
            },
            help: "Explain what this function does..." // Simplest way to specify minimal help text.
      },
    };
```


