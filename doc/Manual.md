PASAR
=====

Promise Aware Smart API Rest builder usage manual.

PASAR is a tool that let you to easily build Express routers with an Smart API REST capabilities.


Installation
------------

To install pasar in your project you just need to type:

    npm install --save pasar

Usage
-----

To build your own API REST with PASAR, you just need to do:

    var Pasar = require("pasar");
    var myApi = Pasar(apiSpec, Options); // Returns Express Router.

...where:

apiSpec
: Your API functionalities specification (implementation and other options). See [Api Specification](#apiSpec).

Options
: (Optional) Object with some options which lets you to fine-tune your desired API capabilities. See [Api Options](#apiOptions).


Mounting API:
-------------

    // Supposing myApp is your Express application:
    myApp.use('/api', myApi); // To mount your api at /api
    // myApp.use(myApi); // To alternatively mount it at the root.

Mounting it on another express router is just the same specifying your router instead of *myApp*.



Thouth you got a Express router in *myRouter*, to mount it in your Express application or router is as simple as:


Extra properties
----------------

Even being valid Express router, PASAR-generated APIs, are provided with some other useful properties:

Promise
: Provide access to it's internal Promise engine. This let's you to avoid requiring it every time.

fn
: Provide access to your api functions as library functions (returning promises). See [Library acces](#fn).

syncFn
: Same as fn, but provide synchronous implementations. See [Synchronousr library access](#syncFn).




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

###[_get, _post, _put, _delete, _all] method implementations.

FIXME


###help:

FIXME

<a name="apiOptions"></a>Api Options
------------------------------------

noLib (boolean, default = false)
: Disables .fn and .syncFn facilites.

noHelp (boolean, default = false)
: Disables /help facilities.

noFilters (boolean, default = false)
: Disables optional formatting filters.

promiseEngine
: Let's to provide your own Promise engine.



<a name="advFeatures"></a>Advanced Features
-------------------------------------------

FIXME



###<a name="fn"></a>Local library function access (Promises): fn

FIXME


###<a name="syncFn"></a>Synchronous local library function access: syncFn

FIXME



