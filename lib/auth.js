// PASAR - lib/defaultAuthHandler.js
// =========================================
// (Promise Aware Smart API Rest) generator.
//
// Tool to easily build Express-like routers with an Smart API REST facilites
//
// @author: Joan Miquel Torres <jmtorres@112ib.com>
// @company: GEIBSAU
// @license: GPL
//
// This is the default athentication hanlder implementation.
// So access is granted for all route paths and methods or facilities by default.
//
//      * Override this with your own implementation to implement your own
//          access control policies.
//
//      * You can achieve this for given function implementation by specifyng
//          alternative auth handler thought authHandler property or globally
//          thought defaults.authHandler option.
//
"use strict";

var Util = require("./util.js");


// Default Authentication Handler returning properties:
// ====================================================

var defaultResponse = { // Default Authentication handler outcome:
    filter: function defOutputFilter(input){return input;}, // No filtering output peformed.
    userData: {},                                           // Empty userData.
    privileges: function defCheckPrivileges(){return {};},  // Empty privileges object whenever asked.
}

// ---------------------------------------------------------------------------
// -  NOTE: Valid responses are:                                             -
// -     To GRANT access to function:                                        -
// -         Object: Preferrably with below structure.                       -
// -             - Empty object is fine (will be silently merged with        -
// -                 defaultResponse properties).                            -
// -             - Customizing that properties, you can fine-tune your       -
// -                 actual function's output:                               -
// -                 · Defining custom output filter.                        -
// -                 · Providing privilege-checking function (which your API -
// -                     function implementation should should take care of  -
// -                     then.                                               -
// -     To REJECT access to function:                                       -
// -         Falsy: That is: boolean false, undefined and anything that      -
// -         evaluates as boolean false.                                     -
// ---------------------------------------------------------------------------


// Default Authentication Handler:
// ===============================

function defaultAuthHandler (//{{{
    // Input:
    pathSpec,   // Actual route path specification (not including format or
                //      facility name). Can be empty for facilities (in case of
                //      root facilities, like help index at /help).

    fmt,        // Format id ("extension"): 'html', 'csv',... or null for default route.

    method,     // Method of facility name. Can be:
                //      * Actual method name in API function requests ("get",
                //          "post", ... / NEVER "all").
                //      * Facility name ("/help", "/form"...)

    ac,         // Access Control related data.
                //      * Let's provide free-formatted access control related
                //          data from API function specification 'ac' property.

    req,        // Express Request object.
                //      * Thought this you can access actual app authentication
                //          data, if any, typically provided by previous
                //          authentication route..

    // "Output" (let to directly handle http response):
    res,        // Express Respons object.
    next        // Express Next() function.
) {

    // -----------------------------------------------------------------------
    // NOTE: This is a default implementation.
    // You can override it with your own implementation thought:
    //      - authHandler[method] property.
    //      - authHandler.all (or simply authHandler) property.
    //      - or Options.defaults.authHandler (optionally with [method] / .all too).
    // -----------------------------------------------------------------------

    // Some rejection examples:
    // ------------------------
    //
    // if ( Drop "privateProfile" from outside of 192.168.0.x lan.
    //      pathSpec == "userProfile"
    //      && ! req.ip.match(/^192\.168\.0\.\d{1,3}$/)
    // ) return {
    //      filter: functon (input) {
    //          var output = {};
    //          Object.keys(input).filter(function(k){
    //              if (k != "privateProfile") output[k] = input[k];
    //          };
    //          return output;
    //      },
    //      userData: defaultResponse.userData,
    //      privileges: defaultResponse.privileges,
    // }
    // if ( // Parametically block help.
    //      method == '/help'
    //      && ac.noHelp
    //  ) return false;
    //  ...
    //

    // Actual default Authentication Handler implementation:
    // =====================================================

    return defaultResponse;
    //      This is a dumb handler, so it returns default response:

    // ...but, alternatively, you can take care of any of the provided input
    // parameters and return proper customized response.

};//}}}

// ---------------------------------------------------------------------------
// -  NOTE: Whenever want to implement your own Authentication Handler, you  -
// -  probably should start from a copy of this defaultHandler() function.   -
// ---------------------------------------------------------------------------
//
// Authentication handler is a function responsible to handle access control in
// a multiple layers at once.
//
// To achieve that, it receives detailed information such as base route path,
// selected output format ("file" extension) if any and full Express Request
// object.
//
// Also receives Express Response object and Next() function to be able to
// fully hanle http response for instance, to perform Next() or redirect
// operation. But it's not mandatory.
//
// Notice that this default authentication hanler DOES ALMOST NOTHING. And this
// is it's actual mission. Each API function will always get:
//
//      - Acces granted.
//      - Empty user profile information.
//      - Dumb privilege checking function:
//          · if (auth.privileges("somePriv")) { /* Got there!! */};
//          · if (auth.privileges().somePriv) { /* Nope */};
//
// This predefined (but extensible) layout makes possible to implement your
// APIs alomst without caring about access control policies and, later, threat
// it as a fully independent module.
// 


// Ensure authentication handlers trustability:
// ============================================

function trustableAuthHandler(//{{{
    authHandler,
    pathSpec,
    ext,
    method,
    ac,
    req,
    actualRes,
    actualNext
) {

    // Provide fake http environment:
    var httpDone = false;
    var res = Object.create(actualRes);
    res.send = function newSend(){
        actualRes.send.apply(actualRes, arguments);
        httpDone = true;
    };
    function next(){
        actualNext.apply(this, arguments);
        httpDone = true;
    };

    // Call actual authentication handler:
    var auth = authHandler(
        pathSpec,
        ext,
        method,
        ac,
        req,
        res,
        next
    );

    // Ensure http handshake is fully handled:
    if (! httpDone && typeof auth != "object") {
        var msg = (typeof auth == "string")
            ? auth
            : "Access denied."
        ;
        Helpers.sendStatusMessage(actualRes, "forbidden", msg);
        httpDone = true;
    };
    if (httpDone) auth = false; // Any response handling in authHandler is also an access reject.


    // Ensure consistent auth interface.
    if (auth) {
        auth.filter || (auth.filter = defaultResponse.filter);
        auth.userData || (auth.userData = defaultResponse.userData);
        auth.privileges || (auth.privileges = defaultResponse.privileges);
        if (
            (typeof auth.filter != "function")
            || (typeof auth.userData != "object")
            || (typeof auth.privileges != "function")
        ) {
            console.error("Wrong auth object", auth);
            Helpers.sendStatusMessage(actualRes, "error", "Internal Server Error");
                // With httpDone = true we were never got here ;-)
        };
    };

    // Return trusted auth data.
    return auth;

};//}}}

// Authentication Handlers can directly hanle response sending 404, 501, etc...
// status messages or redirecting to other route thought next() when user is
// fully unauthorized (auth is falsy).
//
// ...but its actual unique own responsability is to return falsy value when
// access is not allowed. So we should take care that http handshaking is fully
// fullfilled.  Also, even if authHandler returns a access granted response, if
// it already finished http process, we will switch to rejection to avoid
// ensure consistent behaviour.


// Actual auth module outcome:
// ===========================

module.exports = {
    defaultHandler: defaultAuthHandler, // Defautl Authentication Handler.
    defultResponse: defaultResponse,    // Default Authentication Handler outcome.
    trust: trustableAuthHandler,        // Authentication Handler trustability wrappr.
};


