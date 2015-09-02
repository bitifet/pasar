PASAR Reference Manual
======================

> Promise Aware Smart API Rest builder Reference Manual.
> 
> PASAR is a tool that let you to easily build Express routers with an Smart
> API REST capabilities.

This is the PASAR (Promise Aware Smart API Rest) builder reference manual.

This document is intended to be a detailed PASAR Reference Manual.  If you
don't know about PASAR, please, read it's [README](../README.md) file which is
a better introduction document. Specially, its *definitions* section since
those concepts are also used here.


<a name="index"></a>Índex
-------------------------

  * [Installation](#installation)
  * [Usage](#usage)
  * [Mounting API](#mounting)
  * [Extra properties](#properties)
  * [Api Specification](#apiSpec)
    - [[\_get, \_post, \_put, \_delete, \_all] method implementations](#spcMethods)
    - [path](#spcPath)
    - [help](#spcHelp)
    - [form](#spcForm)
    - [meta](#spcMeta)
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
    - [Overridable output filters](#advFilters)
        - New Output Filter implementation](#advFiltersDevel)
    - [Local Library function access (Promises): fn](#advFn)
    - [Synchronous local library function access: syncFn](#advSyncFn)



<a name="installation"></a>Installation
---------------------------------------

To install pasar in your project you just need to type:

### From NPM:

    npm install --save pasar


### From GitHub:

    git clone https://github.com/bitifet/pasar      # Clone repo.
    cd pasar
    npm install                                     # Install dependencies.


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
        serviceName: { // Service name (and default relative route path).
            // (Service specification)
        },
        // ...
    };


Each service specification consists of one or more of the below properties:

### <a name="spcMethods"></a>[\_get, \_post, \_put, \_delete, \_all] method implementations.

FIXME


### <a name="spcPath"></a>path

Route path specification (defaults to /serviceName if not specified). Inital slash is automatically prepended if missing.


### <a name="spcHelp"></a>help

FIXME

### <a name="spcForm"></a>form

FIXME

#### Field Types:

##### json

Actually text input or textarea, but its contents will be parsed as (laxed syntax) JSON.


##### select

Select tags will be threated as special input type "select".

If it has any option having "data-from" property defined, a GET query to specified url will be performed and its response will be used to produce a bunch of options which will replace the original one.

This is performed following below rules:

  * By default it expects a "key: value" object.

  * Value is expected to be string but, if it is an object, first item is automatically picked.

  * Arrays are accepted too as they are actually "key: value" objects. 

  * Also, below modifier attributes are accepted to better pick required data:

    - data-path: Dot-separated path to the actual property containing data to be used.

    - data-key: Key (of the value object properties) to be used for the option tag id (instad of actual array/object key).

    - data-value: Just like data-key, but for description (instead of picking first property as default). Multiple fields can be specified separated by "+" (will be hyphen joined).


**Example (Jade):**

```Jade
    option(data-from="someApiFn", data-path="foo.bar.baz", data-key="keyFld", data-value="descFld")
```



### <a name="spcMeta"></a>meta

FIXME



### <a name="spcAuthHandler"></a>authHandler

Let to override default Authentication Handler.

See "Default Authentication Handler implementation" in [auth.js](../lib/auth.js) library for more detailed explanation.

FIXME: Make a more detailed documentation.


### <a name="spcAc"></a>ac

FIXME


### <a name="spcFilters"></a>outputFilters


Allow to alter available output filters for whole service or for specific method. See [Overridable Output Filters](#advFilters) in [Advanced Features](#advFeatures) section.

FIXME...


### <a name="spcRequestMapper"></a>requestMapper

FIXME


### <a name="spcResponseMapper"></a>responseMapper

FIXME



<a name="apiOptions"></a>Api Options
------------------------------------

Options object serves to modify PASAR default's behaviour in multiple manner.

> NOTE: It is a multidimensional object. But sometimes you could only need to set
> one specific inner value in a more complex structure. To achieve this, you
> could use abbreviated "dotted" syntax for Options object keys.


For example:

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


### <a name="optDisabling"></a>Feature-disabling Options:

noLib (boolean, default = false)
: Disables .fn and .syncFn facilites.

noHelp (boolean, default = false)
: Disables /help facilities.

noForm (boolean, default = false)
: Disables /form facilities.

noFilters (boolean, default = false)
: Disables optional formatting filters.


### <a name="optDefaults"></a>"defaults" Option:

"defaults" Option can be used to define default values to be merged with all Service definitons.

Not fully functional yet. But, for example, allows to define defaults.help.examples.all as ``[{}]``.


### <a name="optClient"></a>"client" Option:

"client" option let's to override some client-side preferences used by special views templates (like help or form views).

Current available client's optins are:

jQuery
: Defaults to googleApis jQuery path. But you may want to override it if you haven't Internet access or prefer to serve your own stored copy.


### <a name="optMisc"></a>Miscellaneous Options:


promiseEngine
: Allow to provide your own Promise engine.

outputFilters
: Allow to alter available output filters globally. See [Overridable Output Filters](#advFilters) in [Advanced Features](#advFeatures) section.

defaultFilter
: Allow to change default output filter. See [Overridable Output Filters](#advFilters) in [Advanced Features](#advFeatures) section.


<a name="advFeatures"></a>Advanced Features
-------------------------------------------


FIXME


### <a name="advAuthHandling"></a>Authentication handling


FIXME


### <a name="advFilters"></a>Overridable output filters


PASAR comes by default with some available output filters.

All request ouput are filtered thought one output filter. Output filters are selected by adding a "file extension" to the default route of the actual route path.

When not specified, default filter (json if not overrided thought *defaultFilter* [option](#optMisc)) is used.

Available filters are defined in [lib/formatters.js]() in coreFilters variable.

Filters can optionally accept a configuration object to alter their behaviour, can be each fully redefined, and reused with diferent options thought distinct extension. And that can be done globally, per service, or for a specific method of given service.

To do that, you can use *outputFilters* [option](#optMisc) and / or [specification property](#spcFilters) consisting in javascript object with as many "extension: filter_definition" pairs as needed.

Each filter definition can be:

  * Boolean false to disable filter addressed by that extension.

  * Options object to reconfigure existing filter.

  * Function implementing new filter.

  * String addressing existing filter.

  * Array [fltName, options] or [function, options] combining those wiht options.


#### <a name="advFiltersAvailable"></a>Available Output Filters:

Currently available (core) output filters are this:


#####json:

This is the default output filter. It just shows data (stripping metadata).


#####raw:

Shows ALL service function output with *data* (actual data) and *meta* (some optional metadata) properties.


#####html:

Html output.


#####csv:

Colon separated text output.

**NOTE:** Currently expects simple array input. But works with regular objects and non-string values will be converted to JSON string. Future versions will come with options to optionally auto-expand sub-elements as "FieldName_n" columns, manage sheets, and more...

Valid options:

  * **separator:** Separator character. Default: comma («,»).
  * **quoting:** Quoting character. Default: double quote («"»).


#####xlsx:

Xlsx output.

Like csv expects simple array input by default, if input is a non-array Object, it is threated as a collection of named sheets.

Then, if non array object is gotten, it is gracefully converted to array, storing key in a unnamend column.

String, number or date cell values are propperly handled. Rest of Objects are automatically replaced to it's JSON string.


#### <a name="advFiltersDevel"></a>New Output Filter implementation:

To implement new output filters or override existing ones you should use below template:


```javascript
    var myOutputFilter = function(setupOptions){

        // Here you can do some intialization work.
        // If necessary, you can return fully distinct filtering function
        // depending on provided setupOptions. Or, instead, simply ignore it.

        function myFilter( // Actual filtering function.
            input               // {data: _actual_input_data_, meta: _some_metadata_}
            , runtimeOptions    // Optional runtime options.
        ){

            var output;
            // Do some stuff to propperly format input in output variable...
            return {
                ctype: "text/html", // Content type for your output.
                data: output
            };
            // NOTE: Alternatively, you can return a promise of that object.
            //   This way, your filter implementation can work asynchronously if needed.
            //   When promise is fullfilled or rejected, apropriate response is sent to client.
            // NOTE 2: This works because default response mapper makes a Promise.resolve() over
            //   filter response. When using your own response handler
            //   implementation, you shoud take care of that if you want to return
            //   promises from your output filters.
        }

        // NOTE: runtimeOptions are undefined by default because output
        // formatting are not exected to change it's behaviour depending on
        // request parameters. But you change this behaviour by
        // defining a requestHandler for your output filter like this:
        //
        // myFilter.requestHandler = function(req) {
        //     // If defined, this request handler will be called with actual
        //     // request object and it's output will be passed to the filter
        //     // as a second parameter.
        //
        //     var myRuntimeOptions;
        //     // Extract desired data from request and propperly set myRuntimeOptions.
        //     return myRuntimeOptions.
        // };


        return myFilter;
    };
```



FIXME...


### <a name="advFn"></a>Local library function access (Promises): fn


FIXME


### <a name="advSyncFn"></a>Synchronous local library function access: syncFn


FIXME



