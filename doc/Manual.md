PASAR Reference Manual
======================

Promise Aware Smart API Rest builder Reference Manual.

PASAR is a tool that let you to easily build Express routers with an Smart API
REST capabilities.

-----------------------------

This is the PASAR (Promise Aware Smart API Rest) builder reference manual.

This document is intended to be a detailed PASAR Reference Manual.  If you
don't know about PASAR, please, read it's [README](../README.md) file which is
a better introduction document. Specially, its *definitions* section since
those concepts are also used here.

-----------------------------

<a name="index"></a>Índex
-------------------------

  * [Installation](#installation)
  * [Usage](#usage)
  * [Mounting API](#mounting)
  * [Extra properties](#properties)
  * [Api Specification](#apiSpec)
    - [[\_get, \_post, \_put, \_delete, \_all] method implementations](#spcMethods)
    - [help](#spcHelp)
    - [authHandler](#spcAuthHandler)
    - [ac](#spcAc)
    - [requestMapper](#spcRequestMapper)
    - [responseMapper](#spcResponseMapper)
  * [Api Options](#apiOptions)
    - [Feature-disabling Options](#optDisabling)
    - ["defaults" option](#optDefaults)
    - ["client" Option](#optClient)
    - [Miscellaneous Options](#optMisc)
  * [Advanced Features](#advFeatures)
    - [Authentication handling](#advAuthHandling)
    - [Local Library function access (Promises): fn](#advFn)
    - [Synchronous local library function access: syncFn](#advSyncFn)



<a name="installation"></a>Installation
---------------------------------------

To install pasar in your project you just need to type:

    npm install --save pasar

<a name="usage"></a>Usage
-------------------------

To build your own API REST with PASAR, you just need to do:

    var Pasar = require("pasar");
    var myApi = Pasar(apiSpec, Options); // Returns Express Router.

...where:

apiSpec
: Your API functionalities specification (implementation and other options). See [Api Specification](#apiSpec).

Options
: (Optional) Object with some options which lets you to fine-tune your desired API capabilities. See [Api Options](#apiOptions).


<a name="mounting"></a>Mounting API:
------------------------------------

    // Supposing myApp is your Express application:
    myApp.use('/api', myApi); // To mount your api at /api
    // myApp.use(myApi); // To alternatively mount it at the root.

Mounting it on another express router is just the same specifying your router instead of *myApp*.



Thouth you got a Express router in *myRouter*, to mount it in your Express application or router is as simple as:


<a name="properties"></a>Extra properties
-----------------------------------------

Even being valid Express router, PASAR-generated APIs, are provided with some other useful properties:

Promise
: Provide access to it's internal Promise engine. This let's you to avoid requiring it every time.

fn
: Provide access to your api functions as library functions (returning promises). See [Library acces](#advFn).

syncFn
: Same as fn, but provide synchronous implementations. See [Synchronousr library access](#advSyncFn).




<a name="apiSpec"></a>Api Specification
---------------------------------------

Api specification consists in an object in the form:

    var apiSpec = {
        someFunction: { // Function name (relative route path).
            // (Function specification)
        },
        // ...
    };


Each function specification consists of one or more of the below properties:

###<a name="spcMethods"></a>[\_get, \_post, \_put, \_delete, \_all] method implementations.

FIXME


###<a name="spcHelp"></a>help

FIXME


###<a name="spcAuthHandler"></a>authHandler

Let to override default Authentication Handler.

See "Default Authentication Handler implementation" in [auth.js](../lib/auth.js) library for more detailed explanation.

FIXME: Make a more detailed documentation.


###<a name="spcAc"></a>ac

FIXME


###<a name="spcRequestMapper"></a>requestMapper

FIXME


###<a name="spcResponseMapper"></a>responseMapper

FIXME



<a name="apiOptions"></a>Api Options
------------------------------------

Options object serves to modify PASAR default's behaviour in multiple manner.

NOTE: It is a multidimensional object. But sometimes you could only need to set one specific inner value in a more complex structure. To achieve this, you could use abbreviated "dotted" syntax for Options object keys. For example:

    var Options = {
        "defaults.help.examples.get": [{}],
        "defaults.help.examples.post": [["Post with test=true", {test: true}]],
    };

...will become to:

    var Options = {
        defaults: {
            help: {
                examples: {
                    get: [{}],
                    post: [["Post with test=true", {test: true}]],
                }
            }
        }
    };


###<a name="optDisabling"></a>Feature-disabling Options:

noLib (boolean, default = false)
: Disables .fn and .syncFn facilites.

noHelp (boolean, default = false)
: Disables /help facilities.

noFilters (boolean, default = false)
: Disables optional formatting filters.


###<a name="optDefaults"></a>"defaults" Option:

"defaults" Option let's define default values to be merged with all Service definitons.

Not fully functional yet. But let's define defaults.help.examples.get as ``[{}]``.


###<a name="optClient"></a>"client" Option:

"client" option let's to override some client-side preferences used by special views templates (like help or form views).

Current available client's optins are:

jQuery
: Defaults to googleApis jQuery path. But you may want to override it if you haven't Internet access or prefer to serve your own stored copy.


###<a name="optMisc"></a>Miscellaneous Options:

promiseEngine
: Let's to provide your own Promise engine.


<a name="advFeatures"></a>Advanced Features
-------------------------------------------

FIXME


###<a name="advAuthHandling"></a>Authentication handling

FIXME


###<a name="advFn"></a>Local library function access (Promises): fn

FIXME


###<a name="advSyncFn"></a>Synchronous local library function access: syncFn

FIXME



