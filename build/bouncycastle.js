(function () {
    'use strict';

    function interopDefault(ex) {
    	return ex && typeof ex === 'object' && 'default' in ex ? ex['default'] : ex;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    (function() {
        "use strict";
        function $$route$recognizer$dsl$$Target(path, matcher, delegate) {
          this.path = path;
          this.matcher = matcher;
          this.delegate = delegate;
        }

        $$route$recognizer$dsl$$Target.prototype = {
          to: function(target, callback) {
            var delegate = this.delegate;

            if (delegate && delegate.willAddRoute) {
              target = delegate.willAddRoute(this.matcher.target, target);
            }

            this.matcher.add(this.path, target);

            if (callback) {
              if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
              this.matcher.addChild(this.path, target, callback, this.delegate);
            }
            return this;
          }
        };

        function $$route$recognizer$dsl$$Matcher(target) {
          this.routes = {};
          this.children = {};
          this.target = target;
        }

        $$route$recognizer$dsl$$Matcher.prototype = {
          add: function(path, handler) {
            this.routes[path] = handler;
          },

          addChild: function(path, target, callback, delegate) {
            var matcher = new $$route$recognizer$dsl$$Matcher(target);
            this.children[path] = matcher;

            var match = $$route$recognizer$dsl$$generateMatch(path, matcher, delegate);

            if (delegate && delegate.contextEntered) {
              delegate.contextEntered(target, match);
            }

            callback(match);
          }
        };

        function $$route$recognizer$dsl$$generateMatch(startingPath, matcher, delegate) {
          return function(path, nestedCallback) {
            var fullPath = startingPath + path;

            if (nestedCallback) {
              nestedCallback($$route$recognizer$dsl$$generateMatch(fullPath, matcher, delegate));
            } else {
              return new $$route$recognizer$dsl$$Target(startingPath + path, matcher, delegate);
            }
          };
        }

        function $$route$recognizer$dsl$$addRoute(routeArray, path, handler) {
          var len = 0;
          for (var i=0; i<routeArray.length; i++) {
            len += routeArray[i].path.length;
          }

          path = path.substr(len);
          var route = { path: path, handler: handler };
          routeArray.push(route);
        }

        function $$route$recognizer$dsl$$eachRoute(baseRoute, matcher, callback, binding) {
          var routes = matcher.routes;

          for (var path in routes) {
            if (routes.hasOwnProperty(path)) {
              var routeArray = baseRoute.slice();
              $$route$recognizer$dsl$$addRoute(routeArray, path, routes[path]);

              if (matcher.children[path]) {
                $$route$recognizer$dsl$$eachRoute(routeArray, matcher.children[path], callback, binding);
              } else {
                callback.call(binding, routeArray);
              }
            }
          }
        }

        var $$route$recognizer$dsl$$default = function(callback, addRouteCallback) {
          var matcher = new $$route$recognizer$dsl$$Matcher();

          callback($$route$recognizer$dsl$$generateMatch("", matcher, this.delegate));

          $$route$recognizer$dsl$$eachRoute([], matcher, function(route) {
            if (addRouteCallback) { addRouteCallback(this, route); }
            else { this.add(route); }
          }, this);
        };

        var $$route$recognizer$$specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
        ];

        var $$route$recognizer$$escapeRegex = new RegExp('(\\' + $$route$recognizer$$specials.join('|\\') + ')', 'g');

        function $$route$recognizer$$isArray(test) {
          return Object.prototype.toString.call(test) === "[object Array]";
        }

        // A Segment represents a segment in the original route description.
        // Each Segment type provides an `eachChar` and `regex` method.
        //
        // The `eachChar` method invokes the callback with one or more character
        // specifications. A character specification consumes one or more input
        // characters.
        //
        // The `regex` method returns a regex fragment for the segment. If the
        // segment is a dynamic of star segment, the regex fragment also includes
        // a capture.
        //
        // A character specification contains:
        //
        // * `validChars`: a String with a list of all valid characters, or
        // * `invalidChars`: a String with a list of all invalid characters
        // * `repeat`: true if the character specification can repeat

        function $$route$recognizer$$StaticSegment(string) { this.string = string; }
        $$route$recognizer$$StaticSegment.prototype = {
          eachChar: function(currentState) {
            var string = this.string, ch;

            for (var i=0; i<string.length; i++) {
              ch = string.charAt(i);
              currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: ch });
            }

            return currentState;
          },

          regex: function() {
            return this.string.replace($$route$recognizer$$escapeRegex, '\\$1');
          },

          generate: function() {
            return this.string;
          }
        };

        function $$route$recognizer$$DynamicSegment(name) { this.name = name; }
        $$route$recognizer$$DynamicSegment.prototype = {
          eachChar: function(currentState) {
            return currentState.put({ invalidChars: "/", repeat: true, validChars: undefined });
          },

          regex: function() {
            return "([^/]+)";
          },

          generate: function(params) {
            return params[this.name];
          }
        };

        function $$route$recognizer$$StarSegment(name) { this.name = name; }
        $$route$recognizer$$StarSegment.prototype = {
          eachChar: function(currentState) {
            return currentState.put({ invalidChars: "", repeat: true, validChars: undefined });
          },

          regex: function() {
            return "(.+)";
          },

          generate: function(params) {
            return params[this.name];
          }
        };

        function $$route$recognizer$$EpsilonSegment() {}
        $$route$recognizer$$EpsilonSegment.prototype = {
          eachChar: function(currentState) {
            return currentState;
          },
          regex: function() { return ""; },
          generate: function() { return ""; }
        };

        function $$route$recognizer$$parse(route, names, specificity) {
          // normalize route as not starting with a "/". Recognition will
          // also normalize.
          if (route.charAt(0) === "/") { route = route.substr(1); }

          var segments = route.split("/");
          var results = new Array(segments.length);

          // A routes has specificity determined by the order that its different segments
          // appear in. This system mirrors how the magnitude of numbers written as strings
          // works.
          // Consider a number written as: "abc". An example would be "200". Any other number written
          // "xyz" will be smaller than "abc" so long as `a > z`. For instance, "199" is smaller
          // then "200", even though "y" and "z" (which are both 9) are larger than "0" (the value
          // of (`b` and `c`). This is because the leading symbol, "2", is larger than the other
          // leading symbol, "1".
          // The rule is that symbols to the left carry more weight than symbols to the right
          // when a number is written out as a string. In the above strings, the leading digit
          // represents how many 100's are in the number, and it carries more weight than the middle
          // number which represents how many 10's are in the number.
          // This system of number magnitude works well for route specificity, too. A route written as
          // `a/b/c` will be more specific than `x/y/z` as long as `a` is more specific than
          // `x`, irrespective of the other parts.
          // Because of this similarity, we assign each type of segment a number value written as a
          // string. We can find the specificity of compound routes by concatenating these strings
          // together, from left to right. After we have looped through all of the segments,
          // we convert the string to a number.
          specificity.val = '';

          for (var i=0; i<segments.length; i++) {
            var segment = segments[i], match;

            if (match = segment.match(/^:([^\/]+)$/)) {
              results[i] = new $$route$recognizer$$DynamicSegment(match[1]);
              names.push(match[1]);
              specificity.val += '3';
            } else if (match = segment.match(/^\*([^\/]+)$/)) {
              results[i] = new $$route$recognizer$$StarSegment(match[1]);
              specificity.val += '1';
              names.push(match[1]);
            } else if(segment === "") {
              results[i] = new $$route$recognizer$$EpsilonSegment();
              specificity.val += '2';
            } else {
              results[i] = new $$route$recognizer$$StaticSegment(segment);
              specificity.val += '4';
            }
          }

          specificity.val = +specificity.val;

          return results;
        }

        // A State has a character specification and (`charSpec`) and a list of possible
        // subsequent states (`nextStates`).
        //
        // If a State is an accepting state, it will also have several additional
        // properties:
        //
        // * `regex`: A regular expression that is used to extract parameters from paths
        //   that reached this accepting state.
        // * `handlers`: Information on how to convert the list of captures into calls
        //   to registered handlers with the specified parameters
        // * `types`: How many static, dynamic or star segments in this route. Used to
        //   decide which route to use if multiple registered routes match a path.
        //
        // Currently, State is implemented naively by looping over `nextStates` and
        // comparing a character specification against a character. A more efficient
        // implementation would use a hash of keys pointing at one or more next states.

        function $$route$recognizer$$State(charSpec) {
          this.charSpec = charSpec;
          this.nextStates = [];
          this.charSpecs = {};
          this.regex = undefined;
          this.handlers = undefined;
          this.specificity = undefined;
        }

        $$route$recognizer$$State.prototype = {
          get: function(charSpec) {
            var this$1 = this;

            if (this.charSpecs[charSpec.validChars]) {
              return this.charSpecs[charSpec.validChars];
            }

            var nextStates = this.nextStates;

            for (var i=0; i<nextStates.length; i++) {
              var child = nextStates[i];

              var isEqual = child.charSpec.validChars === charSpec.validChars;
              isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

              if (isEqual) {
                this$1.charSpecs[charSpec.validChars] = child;
                return child;
              }
            }
          },

          put: function(charSpec) {
            var state;

            // If the character specification already exists in a child of the current
            // state, just return that state.
            if (state = this.get(charSpec)) { return state; }

            // Make a new state for the character spec
            state = new $$route$recognizer$$State(charSpec);

            // Insert the new state as a child of the current state
            this.nextStates.push(state);

            // If this character specification repeats, insert the new state as a child
            // of itself. Note that this will not trigger an infinite loop because each
            // transition during recognition consumes a character.
            if (charSpec.repeat) {
              state.nextStates.push(state);
            }

            // Return the new state
            return state;
          },

          // Find a list of child states matching the next character
          match: function(ch) {
            var nextStates = this.nextStates,
                child, charSpec, chars;

            var returned = [];

            for (var i=0; i<nextStates.length; i++) {
              child = nextStates[i];

              charSpec = child.charSpec;

              if (typeof (chars = charSpec.validChars) !== 'undefined') {
                if (chars.indexOf(ch) !== -1) { returned.push(child); }
              } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
                if (chars.indexOf(ch) === -1) { returned.push(child); }
              }
            }

            return returned;
          }
        };

        // Sort the routes by specificity
        function $$route$recognizer$$sortSolutions(states) {
          return states.sort(function(a, b) {
            return b.specificity.val - a.specificity.val;
          });
        }

        function $$route$recognizer$$recognizeChar(states, ch) {
          var nextStates = [];

          for (var i=0, l=states.length; i<l; i++) {
            var state = states[i];

            nextStates = nextStates.concat(state.match(ch));
          }

          return nextStates;
        }

        var $$route$recognizer$$oCreate = Object.create || function(proto) {
          function F() {}
          F.prototype = proto;
          return new F();
        };

        function $$route$recognizer$$RecognizeResults(queryParams) {
          this.queryParams = queryParams || {};
        }
        $$route$recognizer$$RecognizeResults.prototype = $$route$recognizer$$oCreate({
          splice: Array.prototype.splice,
          slice:  Array.prototype.slice,
          push:   Array.prototype.push,
          length: 0,
          queryParams: null
        });

        function $$route$recognizer$$findHandler(state, path, queryParams) {
          var handlers = state.handlers, regex = state.regex;
          var captures = path.match(regex), currentCapture = 1;
          var result = new $$route$recognizer$$RecognizeResults(queryParams);

          result.length = handlers.length;

          for (var i=0; i<handlers.length; i++) {
            var handler = handlers[i], names = handler.names, params = {};

            for (var j=0; j<names.length; j++) {
              params[names[j]] = captures[currentCapture++];
            }

            result[i] = { handler: handler.handler, params: params, isDynamic: !!names.length };
          }

          return result;
        }

        function $$route$recognizer$$decodeQueryParamPart(part) {
          // http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
          part = part.replace(/\+/gm, '%20');
          var result;
          try {
            result = decodeURIComponent(part);
          } catch(error) {result = '';}
          return result;
        }

        // The main interface

        var $$route$recognizer$$RouteRecognizer = function() {
          this.rootState = new $$route$recognizer$$State();
          this.names = {};
        };


        $$route$recognizer$$RouteRecognizer.prototype = {
          add: function(routes, options) {
            var currentState = this.rootState, regex = "^",
                specificity = {},
                handlers = new Array(routes.length), allSegments = [], name;

            var isEmpty = true;

            for (var i=0; i<routes.length; i++) {
              var route = routes[i], names = [];

              var segments = $$route$recognizer$$parse(route.path, names, specificity);

              allSegments = allSegments.concat(segments);

              for (var j=0; j<segments.length; j++) {
                var segment = segments[j];

                if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

                isEmpty = false;

                // Add a "/" for the new segment
                currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: "/" });
                regex += "/";

                // Add a representation of the segment to the NFA and regex
                currentState = segment.eachChar(currentState);
                regex += segment.regex();
              }
              var handler = { handler: route.handler, names: names };
              handlers[i] = handler;
            }

            if (isEmpty) {
              currentState = currentState.put({ invalidChars: undefined, repeat: false, validChars: "/" });
              regex += "/";
            }

            currentState.handlers = handlers;
            currentState.regex = new RegExp(regex + "$");
            currentState.specificity = specificity;

            if (name = options && options.as) {
              this.names[name] = {
                segments: allSegments,
                handlers: handlers
              };
            }
          },

          handlersFor: function(name) {
            var route = this.names[name];

            if (!route) { throw new Error("There is no route named " + name); }

            var result = new Array(route.handlers.length);

            for (var i=0; i<route.handlers.length; i++) {
              result[i] = route.handlers[i];
            }

            return result;
          },

          hasRoute: function(name) {
            return !!this.names[name];
          },

          generate: function(name, params) {
            var route = this.names[name], output = "";
            if (!route) { throw new Error("There is no route named " + name); }

            var segments = route.segments;

            for (var i=0; i<segments.length; i++) {
              var segment = segments[i];

              if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

              output += "/";
              output += segment.generate(params);
            }

            if (output.charAt(0) !== '/') { output = '/' + output; }

            if (params && params.queryParams) {
              output += this.generateQueryString(params.queryParams, route.handlers);
            }

            return output;
          },

          generateQueryString: function(params, handlers) {
            var pairs = [];
            var keys = [];
            for(var key in params) {
              if (params.hasOwnProperty(key)) {
                keys.push(key);
              }
            }
            keys.sort();
            for (var i = 0; i < keys.length; i++) {
              key = keys[i];
              var value = params[key];
              if (value == null) {
                continue;
              }
              var pair = encodeURIComponent(key);
              if ($$route$recognizer$$isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                  var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
                  pairs.push(arrayPair);
                }
              } else {
                pair += "=" + encodeURIComponent(value);
                pairs.push(pair);
              }
            }

            if (pairs.length === 0) { return ''; }

            return "?" + pairs.join("&");
          },

          parseQueryString: function(queryString) {
            var pairs = queryString.split("&"), queryParams = {};
            for(var i=0; i < pairs.length; i++) {
              var pair      = pairs[i].split('='),
                  key       = $$route$recognizer$$decodeQueryParamPart(pair[0]),
                  keyLength = key.length,
                  isArray = false,
                  value;
              if (pair.length === 1) {
                value = 'true';
              } else {
                //Handle arrays
                if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
                  isArray = true;
                  key = key.slice(0, keyLength - 2);
                  if(!queryParams[key]) {
                    queryParams[key] = [];
                  }
                }
                value = pair[1] ? $$route$recognizer$$decodeQueryParamPart(pair[1]) : '';
              }
              if (isArray) {
                queryParams[key].push(value);
              } else {
                queryParams[key] = value;
              }
            }
            return queryParams;
          },

          recognize: function(path) {
            var states = [ this.rootState ],
                pathLen, i, l, queryStart, queryParams = {},
                isSlashDropped = false;

            queryStart = path.indexOf('?');
            if (queryStart !== -1) {
              var queryString = path.substr(queryStart + 1, path.length);
              path = path.substr(0, queryStart);
              queryParams = this.parseQueryString(queryString);
            }

            path = decodeURI(path);

            if (path.charAt(0) !== "/") { path = "/" + path; }

            pathLen = path.length;
            if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
              path = path.substr(0, pathLen - 1);
              isSlashDropped = true;
            }

            for (i=0; i<path.length; i++) {
              states = $$route$recognizer$$recognizeChar(states, path.charAt(i));
              if (!states.length) { break; }
            }

            var solutions = [];
            for (i=0; i<states.length; i++) {
              if (states[i].handlers) { solutions.push(states[i]); }
            }

            states = $$route$recognizer$$sortSolutions(solutions);

            var state = solutions[0];

            if (state && state.handlers) {
              // if a trailing slash was dropped and a star segment is the last segment
              // specified, put the trailing slash back
              if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
                path = path + "/";
              }
              return $$route$recognizer$$findHandler(state, path, queryParams);
            }
          }
        };

        $$route$recognizer$$RouteRecognizer.prototype.map = $$route$recognizer$dsl$$default;

        $$route$recognizer$$RouteRecognizer.VERSION = '0.1.11';

        var $$route$recognizer$$default = $$route$recognizer$$RouteRecognizer;

        /* global define:true module:true window: true */
        if (typeof define === 'function' && define['amd']) {
          define('route-recognizer', function() { return $$route$recognizer$$default; });
        } else if (typeof module !== 'undefined' && module['exports']) {
          module['exports'] = $$route$recognizer$$default;
        } else if (typeof this !== 'undefined') {
          this['RouteRecognizer'] = $$route$recognizer$$default;
        }
    }).call(undefined);



    var require$$1 = Object.freeze({

    });

    (function (global, factory) {
      typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
      global.FakeXMLHttpRequest = factory()
    }(undefined, function () { 'use strict';

      /**
       * Minimal Event interface implementation
       *
       * Original implementation by Sven Fuchs: https://gist.github.com/995028
       * Modifications and tests by Christian Johansen.
       *
       * @author Sven Fuchs (svenfuchs@artweb-design.de)
       * @author Christian Johansen (christian@cjohansen.no)
       * @license BSD
       *
       * Copyright (c) 2011 Sven Fuchs, Christian Johansen
       */

      var _Event = function Event(type, bubbles, cancelable, target) {
        this.type = type;
        this.bubbles = bubbles;
        this.cancelable = cancelable;
        this.target = target;
      };

      _Event.prototype = {
        stopPropagation: function () {},
        preventDefault: function () {
          this.defaultPrevented = true;
        }
      };

      /*
        Used to set the statusText property of an xhr object
      */
      var httpStatusCodes = {
        100: "Continue",
        101: "Switching Protocols",
        200: "OK",
        201: "Created",
        202: "Accepted",
        203: "Non-Authoritative Information",
        204: "No Content",
        205: "Reset Content",
        206: "Partial Content",
        300: "Multiple Choice",
        301: "Moved Permanently",
        302: "Found",
        303: "See Other",
        304: "Not Modified",
        305: "Use Proxy",
        307: "Temporary Redirect",
        400: "Bad Request",
        401: "Unauthorized",
        402: "Payment Required",
        403: "Forbidden",
        404: "Not Found",
        405: "Method Not Allowed",
        406: "Not Acceptable",
        407: "Proxy Authentication Required",
        408: "Request Timeout",
        409: "Conflict",
        410: "Gone",
        411: "Length Required",
        412: "Precondition Failed",
        413: "Request Entity Too Large",
        414: "Request-URI Too Long",
        415: "Unsupported Media Type",
        416: "Requested Range Not Satisfiable",
        417: "Expectation Failed",
        422: "Unprocessable Entity",
        500: "Internal Server Error",
        501: "Not Implemented",
        502: "Bad Gateway",
        503: "Service Unavailable",
        504: "Gateway Timeout",
        505: "HTTP Version Not Supported"
      };


      /*
        Cross-browser XML parsing. Used to turn
        XML responses into Document objects
        Borrowed from JSpec
      */
      function parseXML(text) {
        var xmlDoc;

        if (typeof DOMParser != "undefined") {
          var parser = new DOMParser();
          xmlDoc = parser.parseFromString(text, "text/xml");
        } else {
          xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
          xmlDoc.async = "false";
          xmlDoc.loadXML(text);
        }

        return xmlDoc;
      }

      /*
        Without mocking, the native XMLHttpRequest object will throw
        an error when attempting to set these headers. We match this behavior.
      */
      var unsafeHeaders = {
        "Accept-Charset": true,
        "Accept-Encoding": true,
        "Connection": true,
        "Content-Length": true,
        "Cookie": true,
        "Cookie2": true,
        "Content-Transfer-Encoding": true,
        "Date": true,
        "Expect": true,
        "Host": true,
        "Keep-Alive": true,
        "Referer": true,
        "TE": true,
        "Trailer": true,
        "Transfer-Encoding": true,
        "Upgrade": true,
        "User-Agent": true,
        "Via": true
      };

      /*
        Adds an "event" onto the fake xhr object
        that just calls the same-named method. This is
        in case a library adds callbacks for these events.
      */
      function _addEventListener(eventName, xhr){
        xhr.addEventListener(eventName, function (event) {
          var listener = xhr["on" + eventName];

          if (listener && typeof listener == "function") {
            listener(event);
          }
        });
      }

      function EventedObject() {
        var this$1 = this;

        this._eventListeners = {};
        var events = ["loadstart", "progress", "load", "abort", "loadend"];
        for (var i = events.length - 1; i >= 0; i--) {
          _addEventListener(events[i], this$1);
        }
      };

      EventedObject.prototype = {
        /*
          Duplicates the behavior of native XMLHttpRequest's addEventListener function
        */
        addEventListener: function addEventListener(event, listener) {
          this._eventListeners[event] = this._eventListeners[event] || [];
          this._eventListeners[event].push(listener);
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's removeEventListener function
        */
        removeEventListener: function removeEventListener(event, listener) {
          var listeners = this._eventListeners[event] || [];

          for (var i = 0, l = listeners.length; i < l; ++i) {
            if (listeners[i] == listener) {
              return listeners.splice(i, 1);
            }
          }
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's dispatchEvent function
        */
        dispatchEvent: function dispatchEvent(event) {
          var this$1 = this;

          var type = event.type;
          var listeners = this._eventListeners[type] || [];

          for (var i = 0; i < listeners.length; i++) {
            if (typeof listeners[i] == "function") {
              listeners[i].call(this$1, event);
            } else {
              listeners[i].handleEvent(event);
            }
          }

          return !!event.defaultPrevented;
        },

        /*
          Triggers an `onprogress` event with the given parameters.
        */
        _progress: function _progress(lengthComputable, loaded, total) {
          var event = new _Event('progress');
          event.target = this;
          event.lengthComputable = lengthComputable;
          event.loaded = loaded;
          event.total = total;
          this.dispatchEvent(event);
        }
      }

      /*
        Constructor for a fake window.XMLHttpRequest
      */
      function FakeXMLHttpRequest() {
        EventedObject.call(this);
        this.readyState = FakeXMLHttpRequest.UNSENT;
        this.requestHeaders = {};
        this.requestBody = null;
        this.status = 0;
        this.statusText = "";
        this.upload = new EventedObject();
      }

      FakeXMLHttpRequest.prototype = new EventedObject();

      // These status codes are available on the native XMLHttpRequest
      // object, so we match that here in case a library is relying on them.
      FakeXMLHttpRequest.UNSENT = 0;
      FakeXMLHttpRequest.OPENED = 1;
      FakeXMLHttpRequest.HEADERS_RECEIVED = 2;
      FakeXMLHttpRequest.LOADING = 3;
      FakeXMLHttpRequest.DONE = 4;

      var FakeXMLHttpRequestProto = {
        UNSENT: 0,
        OPENED: 1,
        HEADERS_RECEIVED: 2,
        LOADING: 3,
        DONE: 4,
        async: true,
        withCredentials: false,

        /*
          Duplicates the behavior of native XMLHttpRequest's open function
        */
        open: function open(method, url, async, username, password) {
          this.method = method;
          this.url = url;
          this.async = typeof async == "boolean" ? async : true;
          this.username = username;
          this.password = password;
          this.responseText = null;
          this.responseXML = null;
          this.requestHeaders = {};
          this.sendFlag = false;
          this._readyStateChange(FakeXMLHttpRequest.OPENED);
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's setRequestHeader function
        */
        setRequestHeader: function setRequestHeader(header, value) {
          verifyState(this);

          if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
            throw new Error("Refused to set unsafe header \"" + header + "\"");
          }

          if (this.requestHeaders[header]) {
            this.requestHeaders[header] += "," + value;
          } else {
            this.requestHeaders[header] = value;
          }
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's send function
        */
        send: function send(data) {
          verifyState(this);

          if (!/^(get|head)$/i.test(this.method)) {
            if (!this.requestHeaders["Content-Type"] && !(data || '').toString().match('FormData')) {
              this.requestHeaders["Content-Type"] = "text/plain;charset=UTF-8";
            }

            this.requestBody = data;
          }

          this.errorFlag = false;
          this.sendFlag = this.async;
          this._readyStateChange(FakeXMLHttpRequest.OPENED);

          if (typeof this.onSend == "function") {
            this.onSend(this);
          }

          this.dispatchEvent(new _Event("loadstart", false, false, this));
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's abort function
        */
        abort: function abort() {
          this.aborted = true;
          this.responseText = null;
          this.errorFlag = true;
          this.requestHeaders = {};

          if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
            this._readyStateChange(FakeXMLHttpRequest.DONE);
            this.sendFlag = false;
          }

          this.readyState = FakeXMLHttpRequest.UNSENT;

          this.dispatchEvent(new _Event("abort", false, false, this));
          if (typeof this.onerror === "function") {
              this.onerror();
          }
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's getResponseHeader function
        */
        getResponseHeader: function getResponseHeader(header) {
          var this$1 = this;

          if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
            return null;
          }

          if (/^Set-Cookie2?$/i.test(header)) {
            return null;
          }

          header = header.toLowerCase();

          for (var h in this.responseHeaders) {
            if (h.toLowerCase() == header) {
              return this$1.responseHeaders[h];
            }
          }

          return null;
        },

        /*
          Duplicates the behavior of native XMLHttpRequest's getAllResponseHeaders function
        */
        getAllResponseHeaders: function getAllResponseHeaders() {
          var this$1 = this;

          if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
            return "";
          }

          var headers = "";

          for (var header in this.responseHeaders) {
            if (this$1.responseHeaders.hasOwnProperty(header) && !/^Set-Cookie2?$/i.test(header)) {
              headers += header + ": " + this$1.responseHeaders[header] + "\r\n";
            }
          }

          return headers;
        },

        /*
         Duplicates the behavior of native XMLHttpRequest's overrideMimeType function
         */
        overrideMimeType: function overrideMimeType(mimeType) {
          if (typeof mimeType === "string") {
            this.forceMimeType = mimeType.toLowerCase();
          }
        },


        /*
          Places a FakeXMLHttpRequest object into the passed
          state.
        */
        _readyStateChange: function _readyStateChange(state) {
          this.readyState = state;

          if (typeof this.onreadystatechange == "function") {
            this.onreadystatechange(new _Event("readystatechange"));
          }

          this.dispatchEvent(new _Event("readystatechange"));

          if (this.readyState == FakeXMLHttpRequest.DONE) {
            this.dispatchEvent(new _Event("load", false, false, this));
            this.dispatchEvent(new _Event("loadend", false, false, this));
          }
        },


        /*
          Sets the FakeXMLHttpRequest object's response headers and
          places the object into readyState 2
        */
        _setResponseHeaders: function _setResponseHeaders(headers) {
          var this$1 = this;

          this.responseHeaders = {};

          for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                this$1.responseHeaders[header] = headers[header];
            }
          }

          if (this.forceMimeType) {
            this.responseHeaders['Content-Type'] = this.forceMimeType;
          }

          if (this.async) {
            this._readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
          } else {
            this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
          }
        },

        /*
          Sets the FakeXMLHttpRequest object's response body and
          if body text is XML, sets responseXML to parsed document
          object
        */
        _setResponseBody: function _setResponseBody(body) {
          var this$1 = this;

          verifyRequestSent(this);
          verifyHeadersReceived(this);
          verifyResponseBodyType(body);

          var chunkSize = this.chunkSize || 10;
          var index = 0;
          this.responseText = "";

          do {
            if (this$1.async) {
              this$1._readyStateChange(FakeXMLHttpRequest.LOADING);
            }

            this$1.responseText += body.substring(index, index + chunkSize);
            index += chunkSize;
          } while (index < body.length);

          var type = this.getResponseHeader("Content-Type");

          if (this.responseText && (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
            try {
              this.responseXML = parseXML(this.responseText);
            } catch (e) {
              // Unable to parse XML - no biggie
            }
          }

          if (this.async) {
            this._readyStateChange(FakeXMLHttpRequest.DONE);
          } else {
            this.readyState = FakeXMLHttpRequest.DONE;
          }
        },

        /*
          Forces a response on to the FakeXMLHttpRequest object.

          This is the public API for faking responses. This function
          takes a number status, headers object, and string body:

          ```
          xhr.respond(404, {Content-Type: 'text/plain'}, "Sorry. This object was not found.")

          ```
        */
        respond: function respond(status, headers, body) {
          this._setResponseHeaders(headers || {});
          this.status = typeof status == "number" ? status : 200;
          this.statusText = httpStatusCodes[this.status];
          this._setResponseBody(body || "");
        }
      };

      for (var property in FakeXMLHttpRequestProto) {
        FakeXMLHttpRequest.prototype[property] = FakeXMLHttpRequestProto[property];
      }

      function verifyState(xhr) {
        if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
          throw new Error("INVALID_STATE_ERR");
        }

        if (xhr.sendFlag) {
          throw new Error("INVALID_STATE_ERR");
        }
      }


      function verifyRequestSent(xhr) {
          if (xhr.readyState == FakeXMLHttpRequest.DONE) {
              throw new Error("Request done");
          }
      }

      function verifyHeadersReceived(xhr) {
          if (xhr.async && xhr.readyState != FakeXMLHttpRequest.HEADERS_RECEIVED) {
              throw new Error("No headers received");
          }
      }

      function verifyResponseBodyType(body) {
          if (typeof body != "string") {
              var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                                   body + ", which is not a string.");
              error.name = "InvalidBodyException";
              throw error;
          }
      }
      var fake_xml_http_request = FakeXMLHttpRequest;

      return fake_xml_http_request;

    }));

var require$$0 = Object.freeze({

    });

    var pretender = createCommonjsModule(function (module) {
    (function(self) {
    'use strict';

    var appearsBrowserified = typeof self !== 'undefined' &&
                              typeof process !== 'undefined' &&
                              Object.prototype.toString.call(process) === '[object Object]';

    var RouteRecognizer = appearsBrowserified ? interopDefault(require$$1) : self.RouteRecognizer;
    var FakeXMLHttpRequest = appearsBrowserified ? interopDefault(require$$0) : self.FakeXMLHttpRequest;

    /**
     * parseURL - decompose a URL into its parts
     * @param  {String} url a URL
     * @return {Object} parts of the URL, including the following
     *
     * 'https://www.yahoo.com:1234/mypage?test=yes#abc'
     *
     * {
     *   host: 'www.yahoo.com:1234',
     *   protocol: 'https:',
     *   search: '?test=yes',
     *   hash: '#abc',
     *   href: 'https://www.yahoo.com:1234/mypage?test=yes#abc',
     *   pathname: '/mypage',
     *   fullpath: '/mypage?test=yes'
     * }
     */
    function parseURL(url) {
      // TODO: something for when document isn't present... #yolo
      var anchor = document.createElement('a');
      anchor.href = url;
      anchor.fullpath = anchor.pathname + (anchor.search || '') + (anchor.hash || '');
      return anchor;
    }


    /**
     * Registry
     *
     * A registry is a map of HTTP verbs to route recognizers.
     */

    function Registry(/* host */) {
      // Herein we keep track of RouteRecognizer instances
      // keyed by HTTP method. Feel free to add more as needed.
      this.verbs = {
        GET: new RouteRecognizer(),
        PUT: new RouteRecognizer(),
        POST: new RouteRecognizer(),
        DELETE: new RouteRecognizer(),
        PATCH: new RouteRecognizer(),
        HEAD: new RouteRecognizer(),
        OPTIONS: new RouteRecognizer()
      };
    }

    /**
     * Hosts
     *
     * a map of hosts to Registries, ultimately allowing
     * a per-host-and-port, per HTTP verb lookup of RouteRecognizers
     */
    function Hosts() {
      this._registries = {};
    }

    /**
     * Hosts#forURL - retrieve a map of HTTP verbs to RouteRecognizers
     *                for a given URL
     *
     * @param  {String} url a URL
     * @return {Registry}   a map of HTTP verbs to RouteRecognizers
     *                      corresponding to the provided URL's
     *                      hostname and port
     */
    Hosts.prototype.forURL = function(url) {
      var host = parseURL(url).host;
      var registry = this._registries[host];

      if (registry === undefined) {
        registry = (this._registries[host] = new Registry(host));
      }

      return registry.verbs;
    };

    function Pretender(/* routeMap1, routeMap2, ...*/) {
      var arguments$1 = arguments;
      var this$1 = this;

      this.hosts = new Hosts();

      this.handlers = [];
      this.handledRequests = [];
      this.passthroughRequests = [];
      this.unhandledRequests = [];
      this.requestReferences = [];

      // reference the native XMLHttpRequest object so
      // it can be restored later
      this._nativeXMLHttpRequest = self.XMLHttpRequest;

      // capture xhr requests, channeling them into
      // the route map.
      self.XMLHttpRequest = interceptor(this);

      // 'start' the server
      this.running = true;

      // trigger the route map DSL.
      for (var i = 0; i < arguments.length; i++) {
        this$1.map(arguments$1[i]);
      }
    }

    function interceptor(pretender) {
      function FakeRequest() {
        // super()
        FakeXMLHttpRequest.call(this);
      }
      // extend
      var proto = new FakeXMLHttpRequest();
      proto.send = function send() {
        if (!pretender.running) {
          throw new Error('You shut down a Pretender instance while there was a pending request. ' +
                'That request just tried to complete. Check to see if you accidentally shut down ' +
                'a pretender earlier than you intended to');
        }

        FakeXMLHttpRequest.prototype.send.apply(this, arguments);
        if (!pretender.checkPassthrough(this)) {
          pretender.handleRequest(this);
        } else {
          var xhr = createPassthrough(this);
          xhr.send.apply(xhr, arguments);
        }
      };


      function createPassthrough(fakeXHR) {
        // event types to handle on the xhr
        var evts = ['error', 'timeout', 'abort', 'readystatechange'];

        // event types to handle on the xhr.upload
        var uploadEvents = ['progress'];

        // properties to copy from the native xhr to fake xhr
        var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];

        var xhr = fakeXHR._passthroughRequest = new pretender._nativeXMLHttpRequest();

        if (fakeXHR.responseType === 'arraybuffer') {
          lifecycleProps = ['readyState', 'response', 'status', 'statusText'];
          xhr.responseType = fakeXHR.responseType;
        }

        // Use onload if the browser supports it
        if ('onload' in xhr) {
          evts.push('load');
        }

        // add progress event for async calls
        if (fakeXHR.async && fakeXHR.responseType !== 'arraybuffer') {
          evts.push('progress');
        }

        // update `propertyNames` properties from `fromXHR` to `toXHR`
        function copyLifecycleProperties(propertyNames, fromXHR, toXHR) {
          for (var i = 0; i < propertyNames.length; i++) {
            var prop = propertyNames[i];
            if (fromXHR[prop]) {
              toXHR[prop] = fromXHR[prop];
            }
          }
        }

        // fire fake event on `eventable`
        function dispatchEvent(eventable, eventType, event) {
          eventable.dispatchEvent(event);
          if (eventable['on' + eventType]) {
            eventable['on' + eventType](event);
          }
        }

        // set the on- handler on the native xhr for the given eventType
        function createHandler(eventType) {
          xhr['on' + eventType] = function(event) {
            copyLifecycleProperties(lifecycleProps, xhr, fakeXHR);
            dispatchEvent(fakeXHR, eventType, event);
          };
        }

        // set the on- handler on the native xhr's `upload` property for
        // the given eventType
        function createUploadHandler(eventType) {
          if (xhr.upload) {
            xhr.upload['on' + eventType] = function(event) {
              dispatchEvent(fakeXHR.upload, eventType, event);
            };
          }
        }

        xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);

        var i;
        for (i = 0; i < evts.length; i++) {
          createHandler(evts[i]);
        }
        for (i = 0; i < uploadEvents.length; i++) {
          createUploadHandler(uploadEvents[i]);
        }

        if (fakeXHR.async) {
          xhr.timeout = fakeXHR.timeout;
          xhr.withCredentials = fakeXHR.withCredentials;
        }
        for (var h in fakeXHR.requestHeaders) {
          xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
        }
        return xhr;
      }

      proto._passthroughCheck = function(method, args) {
        if (this._passthroughRequest) {
          return this._passthroughRequest[method].apply(this._passthroughRequest, args);
        }
        return FakeXMLHttpRequest.prototype[method].apply(this, args);
      };

      proto.abort = function abort() {
        return this._passthroughCheck('abort', arguments);
      };

      proto.getResponseHeader = function getResponseHeader() {
        return this._passthroughCheck('getResponseHeader', arguments);
      };

      proto.getAllResponseHeaders = function getAllResponseHeaders() {
        return this._passthroughCheck('getAllResponseHeaders', arguments);
      };

      FakeRequest.prototype = proto;
      return FakeRequest;
    }

    function verbify(verb) {
      return function(path, handler, async) {
        this.register(verb, path, handler, async);
      };
    }

    function scheduleProgressEvent(request, startTime, totalTime) {
      setTimeout(function() {
        if (!request.aborted && !request.status) {
          var ellapsedTime = new Date().getTime() - startTime.getTime();
          request.upload._progress(true, ellapsedTime, totalTime);
          request._progress(true, ellapsedTime, totalTime);
          scheduleProgressEvent(request, startTime, totalTime);
        }
      }, 50);
    }

    function isArray(array) {
      return Object.prototype.toString.call(array) === '[object Array]';
    }

    var PASSTHROUGH = {};

    Pretender.prototype = {
      get: verbify('GET'),
      post: verbify('POST'),
      put: verbify('PUT'),
      'delete': verbify('DELETE'),
      patch: verbify('PATCH'),
      head: verbify('HEAD'),
      map: function(maps) {
        maps.call(this);
      },
      register: function register(verb, url, handler, async) {
        if (!handler) {
          throw new Error('The function you tried passing to Pretender to handle ' +
            verb + ' ' + url + ' is undefined or missing.');
        }

        handler.numberOfCalls = 0;
        handler.async = async;
        this.handlers.push(handler);

        var registry = this.hosts.forURL(url)[verb];

        registry.add([{
          path: parseURL(url).fullpath,
          handler: handler
        }]);
      },
      passthrough: PASSTHROUGH,
      checkPassthrough: function checkPassthrough(request) {
        var verb = request.method.toUpperCase();

        var path = parseURL(request.url).fullpath;

        verb = verb.toUpperCase();

        var recognized = this.hosts.forURL(request.url)[verb].recognize(path);
        var match = recognized && recognized[0];
        if (match && match.handler === PASSTHROUGH) {
          this.passthroughRequests.push(request);
          this.passthroughRequest(verb, path, request);
          return true;
        }

        return false;
      },
      handleRequest: function handleRequest(request) {
        var verb = request.method.toUpperCase();
        var path = request.url;

        var handler = this._handlerFor(verb, path, request);

        if (handler) {
          handler.handler.numberOfCalls++;
          var async = handler.handler.async;
          this.handledRequests.push(request);

          try {
            var statusHeadersAndBody = handler.handler(request);
            if (!isArray(statusHeadersAndBody)) {
              var note = 'Remember to `return [status, headers, body];` in your route handler.';
              throw new Error('Nothing returned by handler for ' + path + '. ' + note);
            }

            var status = statusHeadersAndBody[0],
                headers = this.prepareHeaders(statusHeadersAndBody[1]),
                body = this.prepareBody(statusHeadersAndBody[2], headers),
                pretender = this;

            this.handleResponse(request, async, function() {
              request.respond(status, headers, body);
              pretender.handledRequest(verb, path, request);
            });
          } catch (error) {
            this.erroredRequest(verb, path, request, error);
            this.resolve(request);
          }
        } else {
          this.unhandledRequests.push(request);
          this.unhandledRequest(verb, path, request);
        }
      },
      handleResponse: function handleResponse(request, strategy, callback) {
        var delay = typeof strategy === 'function' ? strategy() : strategy;
        delay = typeof delay === 'boolean' || typeof delay === 'number' ? delay : 0;

        if (delay === false) {
          callback();
        } else {
          var pretender = this;
          pretender.requestReferences.push({
            request: request,
            callback: callback
          });

          if (delay !== true) {
            scheduleProgressEvent(request, new Date(), delay);
            setTimeout(function() {
              pretender.resolve(request);
            }, delay);
          }
        }
      },
      resolve: function resolve(request) {
        var this$1 = this;

        for (var i = 0, len = this.requestReferences.length; i < len; i++) {
          var res = this$1.requestReferences[i];
          if (res.request === request) {
            res.callback();
            this$1.requestReferences.splice(i, 1);
            break;
          }
        }
      },
      requiresManualResolution: function(verb, path) {
        var handler = this._handlerFor(verb.toUpperCase(), path, {});
        if (!handler) { return false; }

        var async = handler.handler.async;
        return typeof async === 'function' ? async() === true : async === true;
      },
      prepareBody: function(body) { return body; },
      prepareHeaders: function(headers) { return headers; },
      handledRequest: function(/* verb, path, request */) { /* no-op */},
      passthroughRequest: function(/* verb, path, request */) { /* no-op */},
      unhandledRequest: function(verb, path/*, request */) {
        throw new Error('Pretender intercepted ' + verb + ' ' +
          path + ' but no handler was defined for this type of request');
      },
      erroredRequest: function(verb, path, request, error) {
        error.message = 'Pretender intercepted ' + verb + ' ' +
          path + ' but encountered an error: ' + error.message;
        throw error;
      },
      _handlerFor: function(verb, url, request) {
        var registry = this.hosts.forURL(url)[verb];
        var matches = registry.recognize(parseURL(url).fullpath);

        var match = matches ? matches[0] : null;
        if (match) {
          request.params = match.params;
          request.queryParams = matches.queryParams;
        }

        return match;
      },
      shutdown: function shutdown() {
        self.XMLHttpRequest = this._nativeXMLHttpRequest;

        // 'stop' the server
        this.running = false;
      }
    };

    Pretender.parseURL = parseURL;
    Pretender.Hosts = Hosts;
    Pretender.Registry = Registry;

    if (typeof module === 'object') {
      module.exports = Pretender;
    } else if (typeof define !== 'undefined') {
      define('pretender', [], function() {
        return Pretender;
      });
    }
    self.Pretender = Pretender;
    }(self));
    });

    var Pretender = interopDefault(pretender);

    var stream = createCommonjsModule(function (module) {
    "use strict"

    var guid = 0, noop = function() {}, HALT = {}
    function createStream() {
    	function stream() {
    		if (arguments.length > 0) updateStream(stream, arguments[0], undefined)
    		return stream._state.value
    	}
    	initStream(stream, arguments)

    	if (arguments.length > 0) updateStream(stream, arguments[0], undefined)

    	return stream
    }
    function initStream(stream, args) {
    	stream.constructor = createStream
    	stream._state = {id: guid++, value: undefined, error: undefined, state: 0, derive: undefined, recover: undefined, deps: {}, parents: [], errorStream: undefined, endStream: undefined}
    	stream.map = map, stream.ap = ap, stream.of = createStream
    	stream.valueOf = valueOf, stream.toJSON = toJSON, stream.toString = valueOf
    	stream.run = run, stream.catch = doCatch

    	Object.defineProperties(stream, {
    		error: {get: function() {
    			if (!stream._state.errorStream) {
    				var errorStream = function() {
    					if (arguments.length > 0) updateStream(stream, undefined, arguments[0])
    					return stream._state.error
    				}
    				initStream(errorStream, [])
    				initDependency(errorStream, [stream], noop, noop)
    				stream._state.errorStream = errorStream
    			}
    			return stream._state.errorStream
    		}},
    		end: {get: function() {
    			if (!stream._state.endStream) {
    				var endStream = createStream()
    				endStream.map(function(value) {
    					if (value === true) unregisterStream(stream), unregisterStream(endStream)
    					return value
    				})
    				stream._state.endStream = endStream
    			}
    			return stream._state.endStream
    		}}
    	})
    }
    function updateStream(stream, value, error) {
    	updateState(stream, value, error)
    	for (var id in stream._state.deps) updateDependency(stream._state.deps[id], false)
    	finalize(stream)
    }
    function updateState(stream, value, error) {
    	error = unwrapError(value, error)
    	if (error !== undefined && typeof stream._state.recover === "function") {
    		try {
    			var recovered = stream._state.recover()
    			if (recovered === HALT) return
    			updateValues(stream, recovered, undefined)
    		}
    		catch (e) {
    			updateValues(stream, undefined, e)
    			reportUncaughtError(stream, e)
    		}
    	}
    	else updateValues(stream, value, error)
    	stream._state.changed = true
    	if (stream._state.state !== 2) stream._state.state = 1
    }
    function updateValues(stream, value, error) {
    	stream._state.value = value
    	stream._state.error = error
    }
    function updateDependency(stream, mustSync) {
    	var state = stream._state, parents = state.parents
    	if (parents.length > 0 && parents.filter(active).length === parents.length && (mustSync || parents.filter(changed).length > 0)) {
    		var failed = parents.filter(errored)
    		if (failed.length > 0) updateState(stream, undefined, failed[0]._state.error)
    		else {
    			try {
    				var value = state.derive()
    				if (value === HALT) return
    				updateState(stream, value, undefined)
    			}
    			catch (e) {
    				updateState(stream, undefined, e)
    				reportUncaughtError(stream, e)
    			}
    		}
    	}
    }
    function unwrapError(value, error) {
    	if (value != null && value.constructor === createStream) {
    		if (value._state.error !== undefined) error = value._state.error
    		else error = unwrapError(value._state.value, value._state.error)
    	}
    	return error
    }
    function finalize(stream) {
    	stream._state.changed = false
    	for (var id in stream._state.deps) stream._state.deps[id]._state.changed = false
    }
    function reportUncaughtError(stream, e) {
    	if (Object.keys(stream._state.deps).length === 0) {
    		setTimeout(function() {
    			if (Object.keys(stream._state.deps).length === 0) console.error(e)
    		}, 0)
    	}
    }

    function run(fn) {
    	var self = createStream(), stream = this
    	return initDependency(self, [stream], function() {
    		return absorb(self, fn(stream()))
    	}, undefined)
    }
    function doCatch(fn) {
    	var self = createStream(), stream = this
    	var derive = function() {return stream._state.value}
    	var recover = function() {return absorb(self, fn(stream._state.error))}
    	return initDependency(self, [stream], derive, recover)
    }
    function combine(fn, streams) {
    	return initDependency(createStream(), streams, function() {
    		var failed = streams.filter(errored)
    		if (failed.length > 0) throw failed[0]._state.error
    		return fn.apply(this, streams.concat([streams.filter(changed)]))
    	}, undefined)
    }
    function absorb(stream, value) {
    	if (value != null && value.constructor === createStream) {
    		value.error.map(stream.error)
    		value.map(stream)
    		if (value._state.state === 0) return HALT
    		if (value._state.error) throw value._state.error
    		value = value._state.value
    	}
    	return value
    }

    function initDependency(dep, streams, derive, recover) {
    	var state = dep._state
    	state.derive = derive
    	state.recover = recover
    	state.parents = streams.filter(notEnded)

    	registerDependency(dep, state.parents)
    	updateDependency(dep, true)

    	return dep
    }
    function registerDependency(stream, parents) {
    	for (var i = 0; i < parents.length; i++) {
    		parents[i]._state.deps[stream._state.id] = stream
    		registerDependency(stream, parents[i]._state.parents)
    	}
    }
    function unregisterStream(stream) {
    	for (var i = 0; i < stream._state.parents.length; i++) {
    		var parent = stream._state.parents[i]
    		delete parent._state.deps[stream._state.id]
    	}
    	for (var id in stream._state.deps) {
    		var dependent = stream._state.deps[id]
    		var index = dependent._state.parents.indexOf(stream)
    		if (index > -1) dependent._state.parents.splice(index, 1)
    	}
    	stream._state.state = 2 //ended
    	stream._state.deps = {}
    }

    function map(fn) {return combine(function(stream) {return fn(stream())}, [this])}
    function ap(stream) {return combine(function(s1, s2) {return s1()(s2())}, [this, stream])}
    function valueOf() {return this._state.value}
    function toJSON() {return JSON.stringify(this._state.value)}

    function active(stream) {return stream._state.state === 1}
    function changed(stream) {return stream._state.changed}
    function notEnded(stream) {return stream._state.state !== 2}
    function errored(stream) {return stream._state.error}

    function reject(e) {
    	var stream = createStream()
    	stream.error(e)
    	return stream
    }

    function merge(streams) {
    	return combine(function () {
    		return streams.map(function (s) {return s()})
    	}, streams)
    }

    module.exports = {stream: createStream, merge: merge, combine: combine, reject: reject, HALT: HALT}
    });

    var stream$1 = interopDefault(stream);
    var stream$$1 = stream.stream;
    var merge = stream.merge;
    var combine = stream.combine;
    var reject = stream.reject;
    var HALT = stream.HALT;

var require$$0$1 = Object.freeze({
    	default: stream$1,
    	stream: stream$$1,
    	merge: merge,
    	combine: combine,
    	reject: reject,
    	HALT: HALT
    });

    var node = createCommonjsModule(function (module) {
    function Node(tag, key, attrs, children, text, dom) {
    	return {tag: tag, key: key, attrs: attrs, children: children, text: text, dom: dom, domSize: undefined, state: {}, events: undefined, instance: undefined}
    }
    Node.normalize = function(node) {
    	if (node instanceof Array) return Node("[", undefined, undefined, Node.normalizeChildren(node), undefined, undefined)
    	else if (node != null && typeof node !== "object") return Node("#", undefined, undefined, node, undefined, undefined)
    	return node
    }
    Node.normalizeChildren = function normalizeChildren(children) {
    	for (var i = 0; i < children.length; i++) {
    		children[i] = Node.normalize(children[i])
    	}
    	return children
    }

    module.exports = Node
    });

    var node$1 = interopDefault(node);


    var require$$0$2 = Object.freeze({
    	default: node$1
    });

    var hyperscript = createCommonjsModule(function (module) {
    "use strict"

    var Node = interopDefault(require$$0$2)

    var selectorParser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
    var selectorCache = {}
    function hyperscript(selector) {
    	var arguments$1 = arguments;

    	if (typeof selector === "string") {
    		if (selectorCache[selector] === undefined) {
    			var match, tag, classes = [], attributes = {}
    			while (match = selectorParser.exec(selector)) {
    				var type = match[1], value = match[2]
    				if (type === "" && value !== "") tag = value
    				else if (type === "#") attributes.id = value
    				else if (type === ".") classes.push(value)
    				else if (match[3][0] === "[") {
    					var attrValue = match[6]
    					if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1").replace(/\\\\/g, "\\")
    					attributes[match[4]] = attrValue || true
    				}
    			}
    			if (classes.length > 0) attributes.className = classes.join(" ")
    			selectorCache[selector] = function(attrs, children) {
    				var hasAttrs = false, childList, text
    				var className = attrs.className || attrs.class
    				for (var key in attributes) attrs[key] = attributes[key]
    				if (className !== undefined) {
    					if (attrs.class !== undefined) {
    						attrs.class = undefined
    						attrs.className = className
    					}
    					if (attributes.className !== undefined) attrs.className = attributes.className + " " + className
    				}
    				for (var key in attrs) {
    					if (key !== "key") {
    						hasAttrs = true
    						break
    					}
    				}
    				if (children instanceof Array && children.length == 1 && children[0] != null && children[0].tag === "#") text = children[0].children
    				else childList = children

    				return Node(tag || "div", attrs.key, hasAttrs ? attrs : undefined, childList, text, undefined)
    			}
    		}
    	}
    	var attrs, children, childrenIndex
    	if (arguments[1] == null || typeof arguments[1] === "object" && arguments[1].tag === undefined && !(arguments[1] instanceof Array)) {
    		attrs = arguments[1]
    		childrenIndex = 2
    	}
    	else childrenIndex = 1
    	if (arguments.length === childrenIndex + 1) {
    		children = arguments[childrenIndex] instanceof Array ? arguments[childrenIndex] : [arguments[childrenIndex]]
    	}
    	else {
    		children = []
    		for (var i = childrenIndex; i < arguments.length; i++) children.push(arguments$1[i])
    	}

    	if (typeof selector === "string") return selectorCache[selector](attrs || {}, Node.normalizeChildren(children))

    	return Node(selector, attrs && attrs.key, attrs || {}, Node.normalizeChildren(children), undefined, undefined)
    }

    module.exports = hyperscript
    });

    var hyperscript$1 = interopDefault(hyperscript);


    var require$$7 = Object.freeze({
    	default: hyperscript$1
    });

    var render = createCommonjsModule(function (module) {
    "use strict"

    var Node = interopDefault(require$$0$2)

    module.exports = function($window) {
    	var $doc = $window.document
    	var $emptyFragment = $doc.createDocumentFragment()

    	var onevent
    	function setEventCallback(callback) {return onevent = callback}

    	//create
    	function createNodes(parent, vnodes, start, end, hooks, nextSibling, ns) {
    		for (var i = start; i < end; i++) {
    			var vnode = vnodes[i]
    			if (vnode != null) {
    				insertNode(parent, createNode(vnode, hooks, ns), nextSibling)
    			}
    		}
    	}
    	function createNode(vnode, hooks, ns) {
    		var tag = vnode.tag
    		if (vnode.attrs != null) initLifecycle(vnode.attrs, vnode, hooks)
    		if (typeof tag === "string") {
    			switch (tag) {
    				case "#": return createText(vnode)
    				case "<": return createHTML(vnode)
    				case "[": return createFragment(vnode, hooks, ns)
    				default: return createElement(vnode, hooks, ns)
    			}
    		}
    		else return createComponent(vnode, hooks, ns)
    	}
    	function createText(vnode) {
    		return vnode.dom = $doc.createTextNode(vnode.children)
    	}
    	function createHTML(vnode) {
    		var match = vnode.children.match(/^\s*?<(\w+)/im) || []
    		var parent = {caption: "table", thead: "table", tbody: "table", tfoot: "table", tr: "tbody", th: "tr", td: "tr", colgroup: "table", col: "colgroup"}[match[1]] || "div"
    		var temp = $doc.createElement(parent)

    		temp.innerHTML = vnode.children
    		vnode.dom = temp.firstChild
    		vnode.domSize = temp.childNodes.length
    		var fragment = $doc.createDocumentFragment()
    		var child
    		while (child = temp.firstChild) {
    			fragment.appendChild(child)
    		}
    		return fragment
    	}
    	function createFragment(vnode, hooks, ns) {
    		var fragment = $doc.createDocumentFragment()
    		if (vnode.children != null) {
    			var children = vnode.children
    			createNodes(fragment, children, 0, children.length, hooks, null, ns)
    		}
    		vnode.dom = fragment.firstChild
    		vnode.domSize = fragment.childNodes.length
    		return fragment
    	}
    	function createElement(vnode, hooks, ns) {
    		var tag = vnode.tag
    		switch (vnode.tag) {
    			case "svg": ns = "http://www.w3.org/2000/svg"; break
    			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
    		}

    		var attrs = vnode.attrs
    		var is = attrs && attrs.is

    		var element = ns ?
    			is ? $doc.createElementNS(ns, tag, is) : $doc.createElementNS(ns, tag) :
    			is ? $doc.createElement(tag, is) : $doc.createElement(tag)
    		vnode.dom = element

    		if (attrs != null) {
    			setAttrs(vnode, attrs, ns)
    		}

    		if (vnode.text != null) {
    			if (vnode.text !== "") element.textContent = vnode.text
    			else vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
    		}

    		if (vnode.children != null) {
    			var children = vnode.children
    			createNodes(element, children, 0, children.length, hooks, null, ns)
    			setLateAttrs(vnode)
    		}
    		return element
    	}
    	function createComponent(vnode, hooks, ns) {
    		vnode.state = copy(vnode.tag)

    		initLifecycle(vnode.tag, vnode, hooks)
    		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
    		if (vnode.instance != null) {
    			var element = createNode(vnode.instance, hooks, ns)
    			vnode.dom = vnode.instance.dom
    			vnode.domSize = vnode.dom != null ? vnode.instance.domSize : 0
    			return element
    		}
    		else {
    			vnode.domSize = 0
    			return $emptyFragment
    		}
    	}

    	//update
    	function updateNodes(parent, old, vnodes, hooks, nextSibling, ns) {
    		if (old == null && vnodes == null) return
    		else if (old == null) createNodes(parent, vnodes, 0, vnodes.length, hooks, nextSibling, undefined)
    		else if (vnodes == null) removeNodes(parent, old, 0, old.length, vnodes)
    		else {
    			var recycling = isRecyclable(old, vnodes)
    			if (recycling) old = old.concat(old.pool)
    			
    			if (old.length === vnodes.length && vnodes[0] != null && vnodes[0].key == null) {
    				for (var i = 0; i < old.length; i++) {
    					if (old[i] == null && vnodes[i] == null) continue
    					else if (old[i] == null) insertNode(parent, createNode(vnodes[i], hooks, ns), getNextSibling(old, i + 1, nextSibling))
    					else if (vnodes[i] == null) removeNodes(parent, old, i, i + 1, vnodes)
    					else updateNode(parent, old[i], vnodes[i], hooks, getNextSibling(old, i + 1, nextSibling), recycling, ns)
    					if (recycling && old[i].tag === vnodes[i].tag) insertNode(parent, toFragment(old[i]), getNextSibling(old, i + 1, nextSibling))
    				}
    			}
    			else {
    				var oldStart = 0, start = 0, oldEnd = old.length - 1, end = vnodes.length - 1, map
    				while (oldEnd >= oldStart && end >= start) {
    					var o = old[oldStart], v = vnodes[start]
    					if (o === v) oldStart++, start++
    					else if (o != null && v != null && o.key === v.key) {
    						oldStart++, start++
    						updateNode(parent, o, v, hooks, getNextSibling(old, oldStart, nextSibling), recycling, ns)
    						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
    					}
    					else {
    						var o = old[oldEnd]
    						if (o === v) oldEnd--, start++
    						else if (o != null && v != null && o.key === v.key) {
    							updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
    							insertNode(parent, toFragment(o), getNextSibling(old, oldStart, nextSibling))
    							oldEnd--, start++
    						}
    						else break
    					}
    				}
    				while (oldEnd >= oldStart && end >= start) {
    					var o = old[oldEnd], v = vnodes[end]
    					if (o === v) oldEnd--, end--
    					else if (o != null && v != null && o.key === v.key) {
    						updateNode(parent, o, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
    						if (recycling && o.tag === v.tag) insertNode(parent, toFragment(o), nextSibling)
    						if (o.dom != null) nextSibling = o.dom
    						oldEnd--, end--
    					}
    					else {
    						if (!map) map = getKeyMap(old, oldEnd)
    						if (v != null) {
    							var oldIndex = map[v.key]
    							if (oldIndex != null) {
    								var movable = old[oldIndex]
    								updateNode(parent, movable, v, hooks, getNextSibling(old, oldEnd + 1, nextSibling), recycling, ns)
    								insertNode(parent, toFragment(movable), nextSibling)
    								old[oldIndex].skip = true
    								if (movable.dom != null) nextSibling = movable.dom
    							}
    							else {
    								var dom = createNode(v, hooks, undefined)
    								insertNode(parent, dom, nextSibling)
    								nextSibling = dom
    							}
    						}
    						end--
    					}
    					if (end < start) break
    				}
    				createNodes(parent, vnodes, start, end + 1, hooks, nextSibling, undefined)
    				removeNodes(parent, old, oldStart, oldEnd + 1, vnodes)
    			}
    		}
    	}
    	function updateNode(parent, old, vnode, hooks, nextSibling, recycling, ns) {
    		var oldTag = old.tag, tag = vnode.tag
    		if (oldTag === tag) {
    			vnode.state = old.state
    			vnode.events = old.events
    			if (shouldUpdate(vnode, old)) return
    			if (vnode.attrs != null) {
    				updateLifecycle(vnode.attrs, vnode, hooks, recycling)
    			}
    			if (typeof oldTag === "string") {
    				switch (oldTag) {
    					case "#": updateText(old, vnode); break
    					case "<": updateHTML(parent, old, vnode, nextSibling); break
    					case "[": updateFragment(parent, old, vnode, hooks, nextSibling, ns); break
    					default: updateElement(old, vnode, hooks, ns)
    				}
    			}
    			else updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns)
    		}
    		else {
    			removeNode(parent, old, null, false)
    			insertNode(parent, createNode(vnode, hooks, undefined), nextSibling)
    		}
    	}
    	function updateText(old, vnode) {
    		if (old.children.toString() !== vnode.children.toString()) {
    			old.dom.nodeValue = vnode.children
    		}
    		vnode.dom = old.dom
    	}
    	function updateHTML(parent, old, vnode, nextSibling) {
    		if (old.children !== vnode.children) {
    			toFragment(old)
    			insertNode(parent, createHTML(vnode), nextSibling)
    		}
    		else vnode.dom = old.dom
    	}
    	function updateFragment(parent, old, vnode, hooks, nextSibling, ns) {
    		updateNodes(parent, old.children, vnode.children, hooks, nextSibling, ns)
    		var domSize = 0, children = vnode.children
    		vnode.dom = null
    		if (children != null) {
    			for (var i = 0; i < children.length; i++) {
    				var child = children[i]
    				if (child != null && child.dom != null) {
    					if (vnode.dom == null) vnode.dom = child.dom
    					domSize += child.domSize || 1
    				}
    			}
    			if (domSize !== 1) vnode.domSize = domSize
    		}
    	}
    	function updateElement(old, vnode, hooks, ns) {
    		var element = vnode.dom = old.dom
    		switch (vnode.tag) {
    			case "svg": ns = "http://www.w3.org/2000/svg"; break
    			case "math": ns = "http://www.w3.org/1998/Math/MathML"; break
    		}
    		if (vnode.tag === "textarea") {
    			if (vnode.attrs == null) vnode.attrs = {}
    			if (vnode.text != null) vnode.attrs.value = vnode.text //FIXME handle multiple children
    		}
    		updateAttrs(vnode, old.attrs, vnode.attrs, ns)
    		if (old.text != null && vnode.text != null && vnode.text !== "") {
    			if (old.text.toString() !== vnode.text.toString()) old.dom.firstChild.nodeValue = vnode.text
    		}
    		else {
    			if (old.text != null) old.children = [Node("#", undefined, undefined, old.text, undefined, old.dom.firstChild)]
    			if (vnode.text != null) vnode.children = [Node("#", undefined, undefined, vnode.text, undefined, undefined)]
    			updateNodes(element, old.children, vnode.children, hooks, null, ns)
    		}
    	}
    	function updateComponent(parent, old, vnode, hooks, nextSibling, recycling, ns) {
    		vnode.instance = Node.normalize(vnode.tag.view.call(vnode.state, vnode))
    		updateLifecycle(vnode.tag, vnode, hooks, recycling)
    		if (vnode.instance != null) {
    			if (old.instance == null) insertNode(parent, createNode(vnode.instance, hooks, ns), nextSibling)
    			else updateNode(parent, old.instance, vnode.instance, hooks, nextSibling, recycling, ns)
    			vnode.dom = vnode.instance.dom
    			vnode.domSize = vnode.instance.domSize
    		}
    		else if (old.instance != null) {
    			removeNode(parent, old.instance, null, false)
    			vnode.dom = undefined
    			vnode.domSize = 0
    		}
    		else {
    			vnode.dom = old.dom
    			vnode.domSize = old.domSize
    		}
    	}
    	function isRecyclable(old, vnodes) {
    		if (old.pool != null && Math.abs(old.pool.length - vnodes.length) <= Math.abs(old.length - vnodes.length)) {
    			var oldChildrenLength = old[0] && old[0].children && old[0].children.length || 0
    			var poolChildrenLength = old.pool[0] && old.pool[0].children && old.pool[0].children.length || 0
    			var vnodesChildrenLength = vnodes[0] && vnodes[0].children && vnodes[0].children.length || 0
    			if (Math.abs(poolChildrenLength - vnodesChildrenLength) <= Math.abs(oldChildrenLength - vnodesChildrenLength)) {
    				return true
    			}
    		}
    		return false
    	}
    	function getKeyMap(vnodes, end) {
    		var map = {}, i = 0
    		for (var i = 0; i < end; i++) {
    			var vnode = vnodes[i]
    			if (vnode != null) {
    				var key = vnode.key
    				if (key != null) map[key] = i
    			}
    		}
    		return map
    	}
    	function toFragment(vnode) {
    		var count = vnode.domSize
    		if (count != null || vnode.dom == null) {
    			var fragment = $doc.createDocumentFragment()
    			if (count > 0) {
    				var dom = vnode.dom
    				while (--count) fragment.appendChild(dom.nextSibling)
    				fragment.insertBefore(dom, fragment.firstChild)
    			}
    			return fragment
    		}
    		else return vnode.dom
    	}
    	function getNextSibling(vnodes, i, nextSibling) {
    		for (; i < vnodes.length; i++) {
    			if (vnodes[i] != null && vnodes[i].dom != null) return vnodes[i].dom
    		}
    		return nextSibling
    	}

    	function insertNode(parent, dom, nextSibling) {
    		if (nextSibling && nextSibling.parentNode) parent.insertBefore(dom, nextSibling)
    		else parent.appendChild(dom)
    	}

    	//remove
    	function removeNodes(parent, vnodes, start, end, context) {
    		for (var i = start; i < end; i++) {
    			var vnode = vnodes[i]
    			if (vnode != null) {
    				if (vnode.skip) vnode.skip = undefined
    				else removeNode(parent, vnode, context, false)
    			}
    		}
    	}
    	function removeNode(parent, vnode, context, deferred) {
    		if (deferred === false) {
    			var expected = 0, called = 0
    			var callback = function() {
    				if (++called === expected) removeNode(parent, vnode, context, true)
    			}
    			if (vnode.attrs && vnode.attrs.onbeforeremove) {
    				expected++
    				vnode.attrs.onbeforeremove.call(vnode, vnode, callback)
    			}
    			if (typeof vnode.tag !== "string" && vnode.tag.onbeforeremove) {
    				expected++
    				vnode.tag.onbeforeremove.call(vnode, vnode, callback)
    			}
    			if (expected > 0) return
    		}

    		onremove(vnode)
    		if (vnode.dom) {
    			var count = vnode.domSize || 1
    			if (count > 1) {
    				var dom = vnode.dom
    				while (--count) {
    					parent.removeChild(dom.nextSibling)
    				}
    			}
    			if (vnode.dom.parentNode != null) parent.removeChild(vnode.dom)
    			if (context != null && vnode.domSize == null && !hasIntegrationMethods(vnode.attrs) && typeof vnode.tag === "string") { //TODO test custom elements
    				if (!context.pool) context.pool = [vnode]
    				else context.pool.push(vnode)
    			}
    		}
    	}
    	function onremove(vnode) {
    		if (vnode.attrs && vnode.attrs.onremove) vnode.attrs.onremove.call(vnode.state, vnode)
    		if (typeof vnode.tag !== "string" && vnode.tag.onremove) vnode.tag.onremove.call(vnode.state, vnode)
    		if (vnode.instance != null) onremove(vnode.instance)
    		else {
    			var children = vnode.children
    			if (children instanceof Array) {
    				for (var i = 0; i < children.length; i++) {
    					var child = children[i]
    					if (child != null) onremove(child)
    				}
    			}
    		}
    	}

    	//attrs
    	function setAttrs(vnode, attrs, ns) {
    		for (var key in attrs) {
    			setAttr(vnode, key, null, attrs[key], ns)
    		}
    	}
    	function setAttr(vnode, key, old, value, ns) {
    		var element = vnode.dom
    		if (key === "key" || (old === value && !isFormAttribute(vnode, key)) && typeof value !== "object" || typeof value === "undefined" || isLifecycleMethod(key)) return
    		var nsLastIndex = key.indexOf(":")
    		if (nsLastIndex > -1 && key.substr(0, nsLastIndex) === "xlink") {
    			element.setAttributeNS("http://www.w3.org/1999/xlink", key.slice(nsLastIndex + 1), value)
    		}
    		else if (key[0] === "o" && key[1] === "n" && typeof value === "function") updateEvent(vnode, key, value)
    		else if (key === "style") updateStyle(element, old, value)
    		else if (key in element && !isAttribute(key) && ns === undefined) {
    			//setting input[value] to same value by typing on focused element moves cursor to end in Chrome
    			if (vnode.tag === "input" && key === "value" && vnode.dom.value === value && vnode.dom === $doc.activeElement) return
    			element[key] = value
    		}
    		else {
    			if (typeof value === "boolean") {
    				if (value) element.setAttribute(key, "")
    				else element.removeAttribute(key)
    			}
    			else element.setAttribute(key === "className" ? "class" : key, value)
    		}
    	}
    	function setLateAttrs(vnode) {
    		var attrs = vnode.attrs
    		if (vnode.tag === "select" && attrs != null) {
    			if ("value" in attrs) setAttr(vnode, "value", null, attrs.value, undefined)
    			if ("selectedIndex" in attrs) setAttr(vnode, "selectedIndex", null, attrs.selectedIndex, undefined)
    		}
    	}
    	function updateAttrs(vnode, old, attrs, ns) {
    		if (attrs != null) {
    			for (var key in attrs) {
    				setAttr(vnode, key, old && old[key], attrs[key], ns)
    			}
    		}
    		if (old != null) {
    			for (var key in old) {
    				if (attrs == null || !(key in attrs)) {
    					if (key !== "key") vnode.dom.removeAttribute(key)
    				}
    			}
    		}
    	}
    	function isFormAttribute(vnode, attr) {
    		return attr === "value" || attr === "checked" || attr === "selectedIndex" || attr === "selected" && vnode.dom === $doc.activeElement
    	}
    	function isLifecycleMethod(attr) {
    		return attr === "oninit" || attr === "oncreate" || attr === "onupdate" || attr === "onremove" || attr === "onbeforeremove" || attr === "onbeforeupdate"
    	}
    	function isAttribute(attr) {
    		return attr === "href" || attr === "list" || attr === "form"// || attr === "type" || attr === "width" || attr === "height"
    	}
    	function hasIntegrationMethods(source) {
    		return source != null && (source.oncreate || source.onupdate || source.onbeforeremove || source.onremove)
    	}

    	//style
    	function updateStyle(element, old, style) {
    		if (old === style) element.style = "", old = null
    		if (style == null) element.style = ""
    		else if (typeof style === "string") element.style = style
    		else {
    			if (typeof old === "string") element.style = ""
    			for (var key in style) {
    				element.style[key] = style[key]
    			}
    			if (old != null && typeof old !== "string") {
    				for (var key in old) {
    					if (!(key in style)) element.style[key] = ""
    				}
    			}
    		}
    	}

    	//event
    	function updateEvent(vnode, key, value) {
    		var element = vnode.dom
    		var callback = function(e) {
    			var result = value.call(element, e)
    			if (typeof onevent === "function") onevent.call(element, e)
    			return result
    		}
    		if (key in element) element[key] = callback
    		else {
    			var eventName = key.slice(2)
    			if (vnode.events === undefined) vnode.events = {}
    			if (vnode.events[key] != null) element.removeEventListener(eventName, vnode.events[key], false)
    			vnode.events[key] = callback
    			element.addEventListener(eventName, vnode.events[key], false)
    		}
    	}

    	//lifecycle
    	function initLifecycle(source, vnode, hooks) {
    		if (typeof source.oninit === "function") source.oninit.call(vnode.state, vnode)
    		if (typeof source.oncreate === "function") hooks.push(source.oncreate.bind(vnode.state, vnode))
    	}
    	function updateLifecycle(source, vnode, hooks, recycling) {
    		if (recycling) initLifecycle(source, vnode, hooks)
    		else if (typeof source.onupdate === "function") hooks.push(source.onupdate.bind(vnode.state, vnode))
    	}
    	function shouldUpdate(vnode, old) {
    		var forceVnodeUpdate, forceComponentUpdate
    		if (vnode.attrs != null && typeof vnode.attrs.onbeforeupdate === "function") forceVnodeUpdate = vnode.attrs.onbeforeupdate.call(vnode.state, vnode, old)
    		if (typeof vnode.tag !== "string" && typeof vnode.tag.onbeforeupdate === "function") forceComponentUpdate = vnode.tag.onbeforeupdate.call(vnode.state, vnode, old)
    		if (!(forceVnodeUpdate === undefined && forceComponentUpdate === undefined) && !forceVnodeUpdate && !forceComponentUpdate) {
    			vnode.dom = old.dom
    			vnode.domSize = old.domSize
    			vnode.instance = old.instance
    			return true
    		}
    		return false
    	}

    	function copy(data) {
    		if (data instanceof Array) {
    			var output = []
    			for (var i = 0; i < data.length; i++) output[i] = data[i]
    			return output
    		}
    		else if (typeof data === "object") {
    			var output = {}
    			for (var i in data) output[i] = data[i]
    			return output
    		}
    		return data
    	}

    	function render(dom, vnodes) {
    		var hooks = []
    		var active = $doc.activeElement
    		if (dom.vnodes == null) dom.vnodes = []

    		if (!(vnodes instanceof Array)) vnodes = [vnodes]
    		updateNodes(dom, dom.vnodes, Node.normalizeChildren(vnodes), hooks, null, undefined)
    		for (var i = 0; i < hooks.length; i++) hooks[i]()
    		dom.vnodes = vnodes
    		if ($doc.activeElement !== active) active.focus()
    	}

    	return {render: render, setEventCallback: setEventCallback}
    }
    });

    var render$1 = interopDefault(render);


    var require$$1$1 = Object.freeze({
    	default: render$1
    });

    var pubsub = createCommonjsModule(function (module) {
    "use strict"

    module.exports = function() {
    	var callbacks = []
    	function unsubscribe(callback) {
    		var index = callbacks.indexOf(callback)
    		if (index > -1) callbacks.splice(index, 1)
    	}
        function publish() {
            var arguments$1 = arguments;
            var this$1 = this;

            for (var i = 0; i < callbacks.length; i++) {
                callbacks[i].apply(this$1, arguments$1)
            }
        }
    	return {subscribe: callbacks.push.bind(callbacks), unsubscribe: unsubscribe, publish: publish}
    }
    });

    var pubsub$1 = interopDefault(pubsub);


    var require$$5 = Object.freeze({
        default: pubsub$1
    });

    var build = createCommonjsModule(function (module) {
    "use strict"

    module.exports = function(object) {
    	if (Object.prototype.toString.call(object) !== "[object Object]") return ""

    	var args = []
    	for (var key in object) {
    		destructure(key, object[key])
    	}
    	return args.join("&")

    	function destructure(key, value) {
    		if (value instanceof Array) {
    			for (var i = 0; i < value.length; i++) {
    				destructure(key + "[" + i + "]", value[i])
    			}
    		}
    		else if (Object.prototype.toString.call(value) === "[object Object]") {
    			for (var i in value) {
    				destructure(key + "[" + i + "]", value[i])
    			}
    		}
    		else args.push(encodeURIComponent(key) + (value != null && value !== "" ? "=" + encodeURIComponent(value) : ""))
    	}
    }
    });

    var build$1 = interopDefault(build);


    var require$$1$2 = Object.freeze({
    	default: build$1
    });

    var request = createCommonjsModule(function (module) {
    "use strict"

    var buildQueryString = interopDefault(require$$1$2)
    var Stream = interopDefault(require$$0$1)

    module.exports = function($window) {
    	var callbackCount = 0

    	var oncompletion
    	function setCompletionCallback(callback) {oncompletion = callback}
    	
    	function xhr(args) {
    		var stream = Stream.stream()
    		if (args.initialValue !== undefined) stream(args.initialValue)
    		
    		var useBody = typeof args.useBody === "boolean" ? args.useBody : args.method !== "GET" && args.method !== "TRACE"
    		
    		if (typeof args.serialize !== "function") args.serialize = JSON.stringify
    		if (typeof args.deserialize !== "function") args.deserialize = deserialize
    		if (typeof args.extract !== "function") args.extract = extract
    		
    		args.url = interpolate(args.url, args.data)
    		if (useBody) args.data = args.serialize(args.data)
    		else args.url = assemble(args.url, args.data)
    		
    		var xhr = new $window.XMLHttpRequest()
    		xhr.open(args.method, args.url, typeof args.async === "boolean" ? args.async : true, typeof args.user === "string" ? args.user : undefined, typeof args.password === "string" ? args.password : undefined)
    		
    		if (args.serialize === JSON.stringify && useBody) {
    			xhr.setRequestHeader("Content-Type", "application/json; charset=utf-8")
    		}
    		if (args.deserialize === deserialize) {
    			xhr.setRequestHeader("Accept", "application/json, text/*")
    		}
    		
    		if (typeof args.config === "function") xhr = args.config(xhr, args) || xhr
    		
    		xhr.onreadystatechange = function() {
    			if (xhr.readyState === 4) {
    				try {
    					var response = args.deserialize(args.extract(xhr, args))
    					if (xhr.status >= 200 && xhr.status < 300) {
    						if (typeof args.type === "function") {
    							if (response instanceof Array) {
    								for (var i = 0; i < response.length; i++) {
    									response[i] = new args.type(response[i])
    								}
    							}
    							else response = new args.type(response)
    						}
    						
    						stream(response)
    					}
    					else {
    						var error = new Error(xhr.responseText)
    						for (var key in response) error[key] = response[key]
    						stream.error(error)
    					}
    				}
    				catch (e) {
    					stream.error(e)
    				}
    				if (typeof oncompletion === "function") oncompletion()
    			}
    		}
    		
    		if (useBody) xhr.send(args.data)
    		else xhr.send()
    		
    		return stream
    	}

    	function jsonp(args) {
    		var stream = Stream.stream()
    		
    		var callbackName = args.callbackName || "_mithril_" + Math.round(Math.random() * 1e16) + "_" + callbackCount++
    		var script = $window.document.createElement("script")
    		$window[callbackName] = function(data) {
    			script.parentNode.removeChild(script)
    			stream(data)
    			if (typeof oncompletion === "function") oncompletion()
    			delete $window[callbackName]
    		}
    		script.onerror = function() {
    			script.parentNode.removeChild(script)
    			stream.error(new Error("JSONP request failed"))
    			if (typeof oncompletion === "function") oncompletion()
    			delete $window[callbackName]
    		}
    		if (args.data == null) args.data = {}
    		args.url = interpolate(args.url, args.data)
    		args.data[args.callbackKey || "callback"] = callbackName
    		script.src = assemble(args.url, args.data)
    		$window.document.documentElement.appendChild(script)
    		return stream
    	}

    	function interpolate(url, data) {
    		if (data == null) return url

    		var tokens = url.match(/:[^\/]+/gi) || []
    		for (var i = 0; i < tokens.length; i++) {
    			var key = tokens[i].slice(1)
    			if (data[key] != null) {
    				url = url.replace(tokens[i], data[key])
    				delete data[key]
    			}
    		}
    		return url
    	}

    	function assemble(url, data) {
    		var querystring = buildQueryString(data)
    		if (querystring !== "") {
    			var prefix = url.indexOf("?") < 0 ? "?" : "&"
    			url += prefix + querystring
    		}
    		return url
    	}

    	function deserialize(data) {
    		try {return data !== "" ? JSON.parse(data) : null}
    		catch (e) {throw new Error(data)}
    	}

    	function extract(xhr) {return xhr.responseText}
    	
    	return {xhr: xhr, jsonp: jsonp, setCompletionCallback: setCompletionCallback}
    }
    });

    var request$1 = interopDefault(request);


    var require$$4 = Object.freeze({
    	default: request$1
    });

    var parse = createCommonjsModule(function (module) {
    "use strict"

    module.exports = function(string) {
    	if (string === "" || string == null) return {}
    	if (string.charAt(0) === "?") string = string.slice(1)

    	var entries = string.split("&"), data = {}, counters = {}
    	for (var i = 0; i < entries.length; i++) {
    		var entry = entries[i].split("=")
    		var key = decodeURIComponent(entry[0])
    		var value = entry.length === 2 ? decodeURIComponent(entry[1]) : ""

    		//TODO refactor out
    		var number = Number(value)
    		if (value !== "" && !isNaN(number) || value === "NaN") value = number
    		else if (value === "true") value = true
    		else if (value === "false") value = false
    		else {
    			var date = new Date(value)
    			if (!isNaN(date.getTime())) value = date
    		}

    		var levels = key.split(/\]\[?|\[/)
    		var cursor = data
    		if (key.indexOf("[") > -1) levels.pop()
    		for (var j = 0; j < levels.length; j++) {
    			var level = levels[j], nextLevel = levels[j + 1]
    			var isNumber = nextLevel == "" || !isNaN(parseInt(nextLevel, 10))
    			var isValue = j === levels.length - 1
    			if (level === "") {
    				var key = levels.slice(0, j).join()
    				if (counters[key] == null) counters[key] = 0
    				level = counters[key]++
    			}
    			if (cursor[level] == null) {
    				cursor[level] = isValue ? value : isNumber ? [] : {}
    			}
    			cursor = cursor[level]
    		}
    	}
    	return data
    }
    });

    var parse$1 = interopDefault(parse);


    var require$$0$3 = Object.freeze({
    	default: parse$1
    });

    var router$2 = createCommonjsModule(function (module) {
    "use strict"

    var buildQueryString = interopDefault(require$$1$2)
    var parseQueryString = interopDefault(require$$0$3)

    module.exports = function($window) {
    	var supportsPushState = typeof $window.history.pushState === "function" && $window.location.protocol !== "file:"
    	var callAsync = typeof setImmediate === "function" ? setImmediate : setTimeout

    	var prefix = "#!"
    	function setPrefix(value) {prefix = value}

    	function normalize(fragment) {
    		var data = $window.location[fragment].replace(/(?:%[a-f89][a-f0-9])+/gim, decodeURIComponent)
    		if (fragment === "pathname" && data[0] !== "/") data = "/" + data
    		return data
    	}

    	function parsePath(path, queryData, hashData) {
    		var queryIndex = path.indexOf("?")
    		var hashIndex = path.indexOf("#")
    		var pathEnd = queryIndex > -1 ? queryIndex : hashIndex > -1 ? hashIndex : path.length
    		if (queryIndex > -1) {
    			var queryEnd = hashIndex > -1 ? hashIndex : path.length
    			var queryParams = parseQueryString(path.slice(queryIndex + 1, queryEnd))
    			for (var key in queryParams) queryData[key] = queryParams[key]
    		}
    		if (hashIndex > -1) {
    			var hashParams = parseQueryString(path.slice(hashIndex + 1))
    			for (var key in hashParams) hashData[key] = hashParams[key]
    		}
    		return path.slice(0, pathEnd)
    	}

    	function getPath() {
    		var type = prefix.charAt(0)
    		switch (type) {
    			case "#": return normalize("hash").slice(prefix.length)
    			case "?": return normalize("search").slice(prefix.length) + normalize("hash")
    			default: return normalize("pathname").slice(prefix.length) + normalize("search") + normalize("hash")
    		}
    	}

    	function setPath(path, data, options) {
    		var queryData = {}, hashData = {}
    		path = parsePath(path, queryData, hashData)
    		if (data != null) {
    			for (var key in data) queryData[key] = data[key]
    			path = path.replace(/:([^\/]+)/g, function(match, token) {
    				delete queryData[token]
    				return data[token]
    			})
    		}

    		var query = buildQueryString(queryData)
    		if (query) path += "?" + query

    		var hash = buildQueryString(hashData)
    		if (hash) path += "#" + hash

    		if (supportsPushState) {
    			if (options && options.replace) $window.history.replaceState(null, null, prefix + path)
    			else $window.history.pushState(null, null, prefix + path)
    			$window.onpopstate()
    		}
    		else $window.location.href = prefix + path
    	}

    	function defineRoutes(routes, resolve, reject) {
    		if (supportsPushState) $window.onpopstate = resolveRoute
    		else if (prefix.charAt(0) === "#") $window.onhashchange = resolveRoute
    		resolveRoute()
    		
    		function resolveRoute() {
    			var path = getPath()
    			var params = {}
    			var pathname = parsePath(path, params, params)

    			callAsync(function() {
    				for (var route in routes) {
    					var matcher = new RegExp("^" + route.replace(/:[^\/]+?\.{3}/g, "(.*?)").replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

    					if (matcher.test(pathname)) {
    						pathname.replace(matcher, function() {
    							var keys = route.match(/:[^\/]+/g) || []
    							var values = [].slice.call(arguments, 1, -2)
    							for (var i = 0; i < keys.length; i++) {
    								params[keys[i].replace(/:|\./g, "")] = decodeURIComponent(values[i])
    							}
    							resolve(routes[route], params, path, route)
    						})
    						return
    					}
    				}

    				reject(path, params)
    			})
    		}
    		return resolveRoute
    	}

    	function link(vnode) {
    		vnode.dom.setAttribute("href", prefix + vnode.attrs.href)
    		vnode.dom.onclick = function(e) {
    			e.preventDefault()
    			e.redraw = false
    			setPath(vnode.attrs.href, undefined, undefined)
    		}
    	}

    	return {setPrefix: setPrefix, getPath: getPath, setPath: setPath, defineRoutes: defineRoutes, link: link}
    }
    });

    var router$3 = interopDefault(router$2);


    var require$$1$3 = Object.freeze({
    	default: router$3
    });

    var throttle = createCommonjsModule(function (module) {
    "use strict"

    module.exports = function(callback) {
    	//60fps translates to 16.6ms, round it down since setTimeout requires int
    	var time = 16
    	var last = 0, pending = null
    	var timeout = typeof requestAnimationFrame === "function" ? requestAnimationFrame : setTimeout
    	return function(synchronous) {
    		var now = new Date().getTime()
    		if (synchronous === true || last === 0 || now - last >= time) {
    			last = now
    			callback()
    		}
    		else if (pending === null) {
    			pending = timeout(function() {
    				pending = null
    				callback()
    				last = new Date().getTime()
    			}, time - (now - last))
    		}
    	}
    }
    });

    var throttle$1 = interopDefault(throttle);


    var require$$0$5 = Object.freeze({
    	default: throttle$1
    });

    var autoredraw = createCommonjsModule(function (module) {
    "use strict"

    var throttle = interopDefault(require$$0$5)

    module.exports = function(root, renderer, pubsub, callback) {
    	var run = throttle(callback)
    	if (renderer != null) {
    		renderer.setEventCallback(function(e) {
    			if (e.redraw !== false) pubsub.publish()
    		})
    	}

    	if (pubsub != null) {
    		if (root.redraw) pubsub.unsubscribe(root.redraw)
    		pubsub.subscribe(run)
    	}

    	return root.redraw = run
    }
    });

    var autoredraw$1 = interopDefault(autoredraw);


    var require$$0$4 = Object.freeze({
    	default: autoredraw$1
    });

    var router = createCommonjsModule(function (module) {
    "use strict"

    var Node = interopDefault(require$$0$2)
    var coreRouter = interopDefault(require$$1$3)
    var autoredraw = interopDefault(require$$0$4)

    module.exports = function($window, renderer, pubsub) {
    	var router = coreRouter($window)
    	var route = function(root, defaultRoute, routes) {
    		var current = {route: null, component: null}
    		var replay = router.defineRoutes(routes, function(payload, args, path, route) {
    			if (typeof payload.view !== "function") {
    				if (typeof payload.render !== "function") payload.render = function(vnode) {return vnode}
    				var render = function(component) {
    					current.route = route, current.component = component
    					renderer.render(root, payload.render(Node(component, null, args, undefined, undefined, undefined)))
    				}
    				if (typeof payload.resolve !== "function") payload.resolve = function() {render(current.component)}
    				if (route !== current.route) payload.resolve(render, args, path, route)
    				else render(current.component)
    			}
    			else {
    				renderer.render(root, Node(payload, null, args, undefined, undefined, undefined))
    			}
    		}, function() {
    			router.setPath(defaultRoute, null, {replace: true})
    		})
    		autoredraw(root, renderer, pubsub, replay)
    	}
    	route.link = router.link
    	route.prefix = router.setPrefix
    	route.set = router.setPath
    	route.get = router.getPath
    	
    	return route
    }
    });

    var router$1 = interopDefault(router);


    var require$$3 = Object.freeze({
    	default: router$1
    });

    var mount = createCommonjsModule(function (module) {
    "use strict"

    var coreRenderer = interopDefault(require$$1$1)
    var autoredraw = interopDefault(require$$0$4)

    module.exports = function(renderer, pubsub) {
    	return function(root, component) {
    		var run = autoredraw(root, renderer, pubsub, function() {
    			renderer.render(root, {tag: component})
    		})

    		run()
    	}
    }
    });

    var mount$1 = interopDefault(mount);


    var require$$2 = Object.freeze({
    	default: mount$1
    });

    var trust = createCommonjsModule(function (module) {
    "use strict"

    var Node = interopDefault(require$$0$2)

    module.exports = function(html) {
    	return Node("<", undefined, undefined, html, undefined, undefined)
    }
    });

    var trust$1 = interopDefault(trust);


    var require$$1$4 = Object.freeze({
    	default: trust$1
    });

    var withAttr = createCommonjsModule(function (module) {
    "use strict"

    module.exports = function(attrName, callback, context) {
    	return function(e) {
    		return callback.call(context || this, attrName in e.currentTarget ? e.currentTarget[attrName] : e.currentTarget.getAttribute(attrName))
    	}
    }
    });

    var withAttr$1 = interopDefault(withAttr);


    var require$$0$6 = Object.freeze({
    	default: withAttr$1
    });

    var index = createCommonjsModule(function (module) {
    "use strict"

    ;(function () {

    var Stream = interopDefault(require$$0$1)
    var m = interopDefault(require$$7)
    var renderService = interopDefault(require$$1$1)(window)
    var redrawService = interopDefault(require$$5)()
    var requestService = interopDefault(require$$4)(window)

    requestService.setCompletionCallback(redrawService.publish)

    m.version = "bleeding-edge"
    m.request = requestService.xhr
    m.jsonp = requestService.jsonp
    m.route = interopDefault(require$$3)(window, renderService, redrawService)
    m.mount = interopDefault(require$$2)(renderService, redrawService)
    m.trust = interopDefault(require$$1$4)
    m.prop = Stream.stream
    m.prop.combine = Stream.combine
    m.prop.reject = Stream.reject
    m.prop.merge = Stream.merge
    m.prop.HALT = Stream.HALT
    m.withAttr = interopDefault(require$$0$6)
    m.render = renderService.render
    m.redraw = redrawService.publish

    if (typeof module === "object") {
    	module.exports = m
    }
    else window.m = m

    })()
    });

    interopDefault(index);

    var server =  new Pretender();

    server.handledRequest = function(verb, path, request) {
      console.log('caught ?{ verb } ?{ path }');
    };

    server.unhandledRequest = function(verb, path, request) {
      console.log('uncaught ?{ verb } ?{ path }: ', request);
    };

}());