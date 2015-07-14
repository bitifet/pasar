PASAR
=====

> Promise Aware Smart API REST builder to easily implement Express routers with advanced capabilities.


<a name="index"></a>Índex
-------------------------

  * [Abstract](#abstract")
      - [Definitions](#definitions")
      - [Notes](#abstractNotes")
  * [Features](#features")
      - [Basic](#featBasic")
      - [Advanced](#featAdvanced")
      - [More...](#featMore")
  * [Documentation](#documentation)
  * [Examples](#examples)
  * [TO-DO list](#TODO)
  * [Contributing](#contributing)


<a name="abstract"></a>Abstract
-------------------------------

PASAR main goal is to asist you in building consistent and full-featured
promise-based APIs focusing in your business logic and not bothering about
plumbing details.

To achieve it, PASAR proposes a clear and consistent routing schema with a few
conventions to achieve orthogonal feature access. 

That is: To build a full featured API REST, you only need to provide one or two things:

  * A list of (route-) named API function specifications (which, to avoid confusion, we will call it "services" or "service definitions" from now on).
  * An optional Options object to fine-tune PASAR behaviour.

Example:

    var Pasar = require("pasar");

    var Options = {
        // ...
    };

    var myApi = {
        myFunctionName: {
            // Service definition.
        },
        // ...
    };

    module.exports = Pasar(myApi, Options);


Service definitions consists in an object with one or more attributes. Simples't service definition looks like:

    myFunctionName: {
        _all: function myFunction(input, ac) { // Use _get, _post, etc.. to attach your handler to specific http method.
            // input: Your input data. No matter if send by get, post, put, etc...
            //     ...but you can fine-tune this by overridding default request mapper.
            // auth: FIXME: Document it!!.

            return new Pasar.Promise(function(resolve, reject) {
                // Do some (async) logic...

                // ...and finally:
                resolve(someData);
                // ...or:
                reject(reason);
            });
        },
    },


(See more complete [examples]() later...)


###<a name="definitions"></a>Definitions

Service
:   With "Service" we mean any functionality attached to unique url of our API no matter which methods (get, post...) attends or not.

Service Definition
:   Javascript object providing all functions needed to implement all available methods of service and some other optional properties which lets us to change service behaviour in any manner.

Actions
:   Actions (or Action Handlers) are functions attached to ``_get``, ``_post``, ``_put``, ``_delete`` or ``_all`` properties of a Service Definition. They are expected to return a promise of the result data. But, if don't, it's actual result will be automatically promisified.

Request Mapper
:   A Request Mapper is a function responsible to receive the request object and a second parameter with the actual method name and return propper input for the Action Handler. This pattern let's us to access exactly same functionality implementations thouth http as a REST API, or locally as library functions.

Response Mapper
:   Response Mappers are the counterpart of Request Mappers. They receives the promise returned by Actions and perform proper http response (We probably should never override default one).

Facility
:   Facilities are fully automated extra functionalities over all Services (accessed thought *serviceUrl*/*facilityName*) and/or over the whole API (accessed thought /*facilityName*/. The only currently implemented facility is /help.

Export Filters
:   Export Filters (or Export Formatters) let all our services output to be exported to distinct output formats, such as csv, html, etc... SIMPLY adding corresponding extension (.csv, .html...) to the original service url.


###<a name="abstractNotes"></a>Notes

  * We can attach same function to any of the ``_get``, ``_post``, ``_put`` and/or ``_delete`` or simply to ``_all`` (which attaches it to all methods except explicitly specified thought ``_get``, ``_post``, etc...). But actins never knows about actual requested method. So, if we want different behaviour, for example, in GET requests than in POST ones, we should specify our own Request Mapper to provide propper Action input depending on the actual request method.



<a name="features"></a>Features
-------------------------------


###<a name="featBasic"></a>Basic Features

  * Easy method (GET, POST, etc...) attachment handling.

  * Multiple output formats selected by extension (default is .json). Including html (to easy data inspection).
    - .json
    - .html
    - (.csv and more comming soon...)

  * Easy access to self explanation (adding '/help' to each url) and fully automated help index.
    - As simple as supplying single help string.
    - Or as powerful as supplying fully detailed object including method details, examples, etc...
    - Ability to enable examples to be directly triggered from help page (easy checking).
    - Always list all implemented methods even undocumented and, if documented, also unimplemented ones marking them as "undocumented".
    - Fully automated help index (on root's /help) even for undocumented functions.

  * Consistent routing schema:
    - /myRoute -> Default output (JSON) of your service.
    - /myRoute.ext -> Export to "ext" format thought provided output format filters.
    - /myRoute/someId, /myRoute/someId.ext -> Same passing some id...
    - /myRoute/facilityName -> Access to specified facility (/help, /form /test...)
    - /facilityName -> Access to specified facility index (if applies). For example:
        - /help: Help index.
        - /test: Run all tests (not yet implemented).

  * Internally reusable: Services implementation can easily make use of other functions.
    - Method handlers receive JSON object with request parameters NOT request, nor response or next express objects.
    - Also, they are expected to return promises, not actual data or, even less, to deal with http handshaking.

  * Externally reusable: All service actions are externally exposed thought 'fn' property of the resulting router.
    - I.E.: myRouter.fn.someFunction.get({...}); // will call that method handler directly.
    - If it has only one available method definition (even if it is 'all'), simply: myRouter.fn.someFunction({...});
    - Also, you can use all available output filters. Example: myRouter.fn["someFunction.html"].get({...});

  * Externally reusable SYNCHRONOUSLY: Just like 'fn', router is provided with 'syncFn' vector providing sync versions of your service actions (Available **only for Node version v0.11.0 or hihger**).
    - This enables you to reuse simple functionalities as sync functions.
    - But be carefull, that THOSE ARE BLOCKING FUNCTIONS. So use at your own risk.


###<a name="featAdvanced"></a>Advanced Features

  * Advanced access control policies:
    - Including restriction to some functionalities like /help, etc...
    - NOT authentication itself.
        · You can use your own user authentication method like passport
            (https://www.npmjs.com/package/passport) or your own implementation.
        · Then, use that and other information to implement your own access control policies.
        · See "Default Authentication Handler implementation" in
            [auth.js](lib/auth.js) library for more detailed explanation.


  * Custom request mapping:
    - Method handler input is, by default, JSON which is mapped thought predefined callback.
    - You can specify your own one customized for specific or 'all' methods.
    - Example:


    requestMapper: myRequestMapper,


...for more details about how to implement your own request mapper, see [default Request Mapper implementation](lib/defaultRequestMapper.js).

  * Custom response mapping:
    - Method handler output is always expected to be a promise of object containing actual result.
    - This result is redirected to http response by default thought predefined response mapping callback.
    - You can specify your own one customized for specific or 'all' methods.
    - Example:


    responseMapper: myResponseMapper,

...for more details about how to implement your own response mapper, see [default Response Mapper implementation](lib/defaultResponseMapper.js).


###<a name="featMore"></a>More...

  * More comming... (see [TODO](#TODO) )

  * For latest changes see: [CHANGELOG](CHANGELOG.txt)




<a name="documentation"></a>Documentation
-----------------------------------------

Currently the only existing documentation consist in below [examples](#examples) and an uncomplete [Usage Manual](doc/Manual.md).

Maybe you would like to help in building better one... (see [Contributing](#contributing))



<a name="examples"></a>Examples
-------------------------------

All API definitions should look's like follows:


```javascript
    var Promise = require("promise"); // Or your favorite promise library.
    var Pasar = require("pasar");

    var Options = { // Comment-out / modify as you need...
        // noLib: true,     // ...to disable .fn and .syncFn facilites.
        // noHelp: true,    // ...to disable /help facilities.
        // noFilters: true, // ...to disable optional formatting filters.
        // "defaults.help.examples.get": [{}], // ...to automatically provide all your functions help with simple example.
        // "defaults.authHanlder": myAuthHandler, // ...to sepcify your own authentication handler.
        // "defaults.requestMapper": myRequestMapper, // ...to sepcify your own request mapper.
        // "defaults.responseMapper": myResponseMapper, // ...to sepcify your own response mapper.
        // promiseEngine: myPromiseEngine, // ...to provide your own promise engine.
        // "client.jQuery": "url_to_jQuery" // ...to override jQuery path in facility views.
        // ... (See documentation for more details on available options).
    };

    var myApi = {
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
                    all: "Method specific explanation", // Default text. I ommitted, defaults to "(Undocumented)".
                    _get: "Specific explanation for GET method", // 'get' and '_get' are threated the same.
                    // post: "", // As commented out, it will default to "all" text.
                    put: "Some future method explanation.", // Will be marked as "UNIMPLEMENTD".
                    // delete: "", // As commented out and unimplemented, will NOT be shown.
                },
                examples: { // (get/_get, post...) Just like methods definitions...
                    get: [, // Simple GET example without parameters labelled by its url.
                         {}, // Add example to query without parameters.
                         ['label', {foo: "bar"}, "Some optional comment"], // Another with parameters.
                         [null, [bar: "baz"}], // Another auto-labelled example.
                             // NOTE: All get examples are automatically linked to it's url.
                             // NOTE 2: Post, put, etc... are actually linked to "#".
                             //     In (I hope) near future I expect to implement links to them via ajax call (TODO).
                             // NOTE 3: Simplest get specification is: «get: [{}]»,
                    ],
                    post: [
                        ['Hello', {foo: "bar"}, "long explanation"],
                        ['World', {foo: "bar"}, "More longer explanation"],
                    ],
                    put: [{foo: "bar"}],
                    // ...
                },
            },
        },
        someOtherFunction: {
            _all: function(input) {
                // Do some stuff...
                return new Promise(function(resolve, reject) {
                        // Do some async stuff...
                        // And somewhere:
                        resolve({...});
                            // If no need for metadata and no data vector specified,
                            // this will be automagically remapped to:
                            // {
                            //     data: {...}, // Actual function response.
                            //     meta: {...}, // Some optional metadata which could be used by many output filteres.
                            //                 // i.e. page title, field types, etc...
                            // }
                            // ...so you can simply resolve with your actual result EXCEPT if it could contain
                            // a 'data' vector in its root level. In which case you should at least resolve
                            // with {data:{...}}

                        // And in some other place:
                        reject(error);
                });
            },
            help: "Explain what this function does..." // Simplest way to specify minimal help text.
      },
    };
    
    module.exports = Pasar(myApi, Options);

```



Then, to mount your API REST to your Express router simply:

```javascript
    var Express = require('express');
    var Router = Express.Router();

    // Load API definitions:
    var someAPI = require("__path_to_my_api__");
    var someOtherAPI = require("__path_to_my_other_api__");

    // To mount your api at /api route:
    Router.use('/api', someAPI);

    // To mount your api at your router root:
    Router.use(someOtherAPI);

    // To access Services as library:
    someApi.fn.someFunction.get({foo: "bar"})
        .then(function(data){console.log(data);})
        .catch(throw)
    ;

    // Also with available output filters:
    var resultPromise = somApi.fn["someFunction.html"]({foo: "bar"}); // Promise. Use .then(), .catch()...
        // ".get", ".post", etc... can be ommited when only one method is implemented.

    // To access Services as sync library:
    var result = someApi.syncFn.someFunction({foo: "bar"});
        // WARNING:
        //      * Sync functions are blocking. Use at your own risk!!
        //      * They are not availible in Node versions under v0.11.0.
        //      * In earlier Node versions, it will throw an exception if you try to use it.
        //      * Not yet tested (sorry) could not properly work even with node v0.11.0 or higher.

    // Or simply:
    // Router.use('/api', require("__path_to_my_api__"))  // Mounted on /api.
    // Router.use(require("__path_to_my_other_api__"))    // Mounted on root.
    // var myAsyncLib = require("__path_to_my_api__").fn; // Async (returns promises).

```



<a name="TODO"></a> TODO
------------------------

  * Easy querying while developing with automated (but customizable) '/form' facilities.

  * Posibility to execute predefined tests clientside thought /test facilities.

  * Configurable logging capabilites (including time measurement).

  * Global, per-api and per-function configurable timeouts (via promise rejection).

  * Promise-level caching.

  * WebSocket update events interface (DRAFT).
    - Sometimes data provided by a REST API becomes outdated too shortly.
    - WebSocket update events if enabled, will provide your method handlers with an "update callback" as a second parameter.
    - Then, your method implementation, althought returning promise for whole data, could start watching for future changes.
    - When a change happen, then should call that callback with new data causing websocket update event to be send to client's that support it.
    - Updated data could optionally be send as diff from previous.
    - Update-events, also, will cause cached (promise) responses to be silently updated. So new requests and clients not supporting WebSocket update events, will also benefit of them.

  * Client-side javascript library.
    - Will provide javascript client library downloadable thought /client.
    - This library will provide a js API to access server's API-REST functionalities.
    - Also, will integrate support for WebSockete update events transparently handling "diff" packed data.


<a name="contributing"></a>Contributing
---------------------------------------

If you are interested in contributing with this project, you can do it in many ways:

  * Creating and/or mantainig documentation.

  * Implementing new features or improving code implementation.

  * Reporting bugs and/or fixing it.
  
  * Sending me any other feedback.

  * Whatever you like...
    
Please, contact-me, open issues or send pull-requests thought [this project GIT repository](https://github.com/bitifet/pasar)

