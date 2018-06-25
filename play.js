(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.play = {})));
}(this, (function (exports) { 'use strict';

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	function createCommonjsModule(fn, module) {
		return module = { exports: {} }, fn(module, module.exports), module.exports;
	}

	// https://github.com/maxogden/websocket-stream/blob/48dc3ddf943e5ada668c31ccd94e9186f02fafbd/ws-fallback.js

	var ws = null;

	if (typeof WebSocket !== 'undefined') {
	  ws = WebSocket;
	} else if (typeof MozWebSocket !== 'undefined') {
	  ws = MozWebSocket;
	} else if (typeof commonjsGlobal !== 'undefined') {
	  ws = commonjsGlobal.WebSocket || commonjsGlobal.MozWebSocket;
	} else if (typeof window !== 'undefined') {
	  ws = window.WebSocket || window.MozWebSocket;
	} else if (typeof self !== 'undefined') {
	  ws = self.WebSocket || self.MozWebSocket;
	}

	var browser = ws;

	var bind = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */

	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	var isBuffer_1 = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	};

	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}

	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}

	/*global toString:true*/

	// utils is a library of generic helper functions non-specific to axios

	var toString = Object.prototype.toString;

	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}

	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}

	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}

	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}

	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}

	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}

	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}

	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}

	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}

	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}

	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}

	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}

	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}

	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}

	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}

	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}

	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }

	  // Force an array if not already something iterable
	  if (typeof obj !== 'object') {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }

	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}

	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }

	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}

	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}

	var utils = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer_1,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};

	var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};

	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	var enhanceError = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.request = request;
	  error.response = response;
	  return error;
	};

	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	var createError = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};

	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	var settle = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};

	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}

	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	var buildURL = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }

	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];

	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }

	      if (utils.isArray(val)) {
	        key = key + '[]';
	      } else {
	        val = [val];
	      }

	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });

	    serializedParams = parts.join('&');
	  }

	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }

	  return url;
	};

	// Headers whose duplicates are ignored by node
	// c.f. https://nodejs.org/api/http.html#http_message_headers
	var ignoreDuplicateOf = [
	  'age', 'authorization', 'content-length', 'content-type', 'etag',
	  'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
	  'last-modified', 'location', 'max-forwards', 'proxy-authorization',
	  'referer', 'retry-after', 'user-agent'
	];

	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	var parseHeaders = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;

	  if (!headers) { return parsed; }

	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));

	    if (key) {
	      if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
	        return;
	      }
	      if (key === 'set-cookie') {
	        parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
	      } else {
	        parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	      }
	    }
	  });

	  return parsed;
	};

	var isURLSameOrigin = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;

	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;

	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }

	      urlParsingNode.setAttribute('href', href);

	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }

	    originURL = resolveURL(window.location.href);

	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :

	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);

	// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js

	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

	function E() {
	  this.message = 'String contains an invalid character';
	}
	E.prototype = new Error;
	E.prototype.code = 5;
	E.prototype.name = 'InvalidCharacterError';

	function btoa(input) {
	  var str = String(input);
	  var output = '';
	  for (
	    // initialize result and counter
	    var block, charCode, idx = 0, map = chars;
	    // if the next str index does not exist:
	    //   change the mapping table to "="
	    //   check if d has no fractional digits
	    str.charAt(idx | 0) || (map = '=', idx % 1);
	    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	  ) {
	    charCode = str.charCodeAt(idx += 3 / 4);
	    if (charCode > 0xFF) {
	      throw new E();
	    }
	    block = block << 8 | charCode;
	  }
	  return output;
	}

	var btoa_1 = btoa;

	var cookies = (
	  utils.isStandardBrowserEnv() ?

	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));

	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }

	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }

	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }

	        if (secure === true) {
	          cookie.push('secure');
	        }

	        document.cookie = cookie.join('; ');
	      },

	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },

	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :

	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);

	var btoa$1 = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || btoa_1;

	var xhr = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;

	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }

	    var request = new XMLHttpRequest();
	    var loadEvent = 'onreadystatechange';
	    var xDomain = false;

	    // For IE 8/9 CORS support
	    // Only supports POST and GET calls and doesn't returns the response headers.
	    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
	    if (typeof window !== 'undefined' &&
	        window.XDomainRequest && !('withCredentials' in request) &&
	        !isURLSameOrigin(config.url)) {
	      request = new window.XDomainRequest();
	      loadEvent = 'onload';
	      xDomain = true;
	      request.onprogress = function handleProgress() {};
	      request.ontimeout = function handleTimeout() {};
	    }

	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa$1(username + ':' + password);
	    }

	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);

	    // Set the request timeout in MS
	    request.timeout = config.timeout;

	    // Listen for ready state
	    request[loadEvent] = function handleLoad() {
	      if (!request || (request.readyState !== 4 && !xDomain)) {
	        return;
	      }

	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }

	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        // IE sends 1223 instead of 204 (https://github.com/axios/axios/issues/201)
	        status: request.status === 1223 ? 204 : request.status,
	        statusText: request.status === 1223 ? 'No Content' : request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };

	      settle(resolve, reject, response);

	      // Clean up request
	      request = null;
	    };

	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));

	      // Clean up request
	      request = null;
	    };

	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
	        request));

	      // Clean up request
	      request = null;
	    };

	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies$$1 = cookies;

	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies$$1.read(config.xsrfCookieName) :
	          undefined;

	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }

	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }

	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }

	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }

	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }

	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }

	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }

	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }

	    if (requestData === undefined) {
	      requestData = null;
	    }

	    // Send the request
	    request.send(requestData);
	  });
	};

	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};

	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}

	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = xhr;
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = xhr;
	  }
	  return adapter;
	}

	var defaults = {
	  adapter: getDefaultAdapter(),

	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],

	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],

	  /**
	   * A timeout in milliseconds to abort a request. If set to 0 (default) a
	   * timeout is not created.
	   */
	  timeout: 0,

	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',

	  maxContentLength: -1,

	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};

	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};

	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});

	var defaults_1 = defaults;

	function InterceptorManager() {
	  this.handlers = [];
	}

	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};

	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};

	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};

	var InterceptorManager_1 = InterceptorManager;

	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	var transformData = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });

	  return data;
	};

	var isCancel = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};

	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	var isAbsoluteURL = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};

	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	var combineURLs = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}

	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	var dispatchRequest = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);

	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }

	  // Ensure headers exist
	  config.headers = config.headers || {};

	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );

	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );

	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );

	  var adapter = config.adapter || defaults_1.adapter;

	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);

	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );

	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);

	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }

	    return Promise.reject(reason);
	  });
	};

	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager_1(),
	    response: new InterceptorManager_1()
	  };
	}

	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }

	  config = utils.merge(defaults_1, {method: 'get'}, this.defaults, config);
	  config.method = config.method.toLowerCase();

	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);

	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });

	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });

	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }

	  return promise;
	};

	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});

	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});

	var Axios_1 = Axios;

	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}

	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};

	Cancel.prototype.__CANCEL__ = true;

	var Cancel_1 = Cancel;

	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }

	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });

	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }

	    token.reason = new Cancel_1(message);
	    resolvePromise(token.reason);
	  });
	}

	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};

	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};

	var CancelToken_1 = CancelToken;

	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	var spread = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};

	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios_1(defaultConfig);
	  var instance = bind(Axios_1.prototype.request, context);

	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios_1.prototype, context);

	  // Copy context to instance
	  utils.extend(instance, context);

	  return instance;
	}

	// Create the default instance to be exported
	var axios = createInstance(defaults_1);

	// Expose Axios class to allow class inheritance
	axios.Axios = Axios_1;

	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults_1, instanceConfig));
	};

	// Expose Cancel & CancelToken
	axios.Cancel = Cancel_1;
	axios.CancelToken = CancelToken_1;
	axios.isCancel = isCancel;

	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = spread;

	var axios_1 = axios;

	// Allow use of default import syntax in TypeScript
	var default_1 = axios;
	axios_1.default = default_1;

	var axios$1 = axios_1;

	var eventemitter3 = createCommonjsModule(function (module) {

	var has = Object.prototype.hasOwnProperty
	  , prefix = '~';

	/**
	 * Constructor to create a storage for our `EE` objects.
	 * An `Events` instance is a plain object whose properties are event names.
	 *
	 * @constructor
	 * @private
	 */
	function Events() {}

	//
	// We try to not inherit from `Object.prototype`. In some engines creating an
	// instance in this way is faster than calling `Object.create(null)` directly.
	// If `Object.create(null)` is not supported we prefix the event names with a
	// character to make sure that the built-in object properties are not
	// overridden or used as an attack vector.
	//
	if (Object.create) {
	  Events.prototype = Object.create(null);

	  //
	  // This hack is needed because the `__proto__` property is still inherited in
	  // some old browsers like Android 4, iPhone 5.1, Opera 11 and Safari 5.
	  //
	  if (!new Events().__proto__) prefix = false;
	}

	/**
	 * Representation of a single event listener.
	 *
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} [once=false] Specify if the listener is a one-time listener.
	 * @constructor
	 * @private
	 */
	function EE(fn, context, once) {
	  this.fn = fn;
	  this.context = context;
	  this.once = once || false;
	}

	/**
	 * Add a listener for a given event.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} context The context to invoke the listener with.
	 * @param {Boolean} once Specify if the listener is a one-time listener.
	 * @returns {EventEmitter}
	 * @private
	 */
	function addListener(emitter, event, fn, context, once) {
	  if (typeof fn !== 'function') {
	    throw new TypeError('The listener must be a function');
	  }

	  var listener = new EE(fn, context || emitter, once)
	    , evt = prefix ? prefix + event : event;

	  if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
	  else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
	  else emitter._events[evt] = [emitter._events[evt], listener];

	  return emitter;
	}

	/**
	 * Clear event by name.
	 *
	 * @param {EventEmitter} emitter Reference to the `EventEmitter` instance.
	 * @param {(String|Symbol)} evt The Event name.
	 * @private
	 */
	function clearEvent(emitter, evt) {
	  if (--emitter._eventsCount === 0) emitter._events = new Events();
	  else delete emitter._events[evt];
	}

	/**
	 * Minimal `EventEmitter` interface that is molded against the Node.js
	 * `EventEmitter` interface.
	 *
	 * @constructor
	 * @public
	 */
	function EventEmitter() {
	  this._events = new Events();
	  this._eventsCount = 0;
	}

	/**
	 * Return an array listing the events for which the emitter has registered
	 * listeners.
	 *
	 * @returns {Array}
	 * @public
	 */
	EventEmitter.prototype.eventNames = function eventNames() {
	  var names = []
	    , events
	    , name;

	  if (this._eventsCount === 0) return names;

	  for (name in (events = this._events)) {
	    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
	  }

	  if (Object.getOwnPropertySymbols) {
	    return names.concat(Object.getOwnPropertySymbols(events));
	  }

	  return names;
	};

	/**
	 * Return the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Array} The registered listeners.
	 * @public
	 */
	EventEmitter.prototype.listeners = function listeners(event) {
	  var evt = prefix ? prefix + event : event
	    , handlers = this._events[evt];

	  if (!handlers) return [];
	  if (handlers.fn) return [handlers.fn];

	  for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
	    ee[i] = handlers[i].fn;
	  }

	  return ee;
	};

	/**
	 * Return the number of listeners listening to a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Number} The number of listeners.
	 * @public
	 */
	EventEmitter.prototype.listenerCount = function listenerCount(event) {
	  var evt = prefix ? prefix + event : event
	    , listeners = this._events[evt];

	  if (!listeners) return 0;
	  if (listeners.fn) return 1;
	  return listeners.length;
	};

	/**
	 * Calls each of the listeners registered for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @returns {Boolean} `true` if the event had listeners, else `false`.
	 * @public
	 */
	EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return false;

	  var listeners = this._events[evt]
	    , len = arguments.length
	    , args
	    , i;

	  if (listeners.fn) {
	    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

	    switch (len) {
	      case 1: return listeners.fn.call(listeners.context), true;
	      case 2: return listeners.fn.call(listeners.context, a1), true;
	      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
	      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
	      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
	      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
	    }

	    for (i = 1, args = new Array(len -1); i < len; i++) {
	      args[i - 1] = arguments[i];
	    }

	    listeners.fn.apply(listeners.context, args);
	  } else {
	    var length = listeners.length
	      , j;

	    for (i = 0; i < length; i++) {
	      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

	      switch (len) {
	        case 1: listeners[i].fn.call(listeners[i].context); break;
	        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
	        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
	        case 4: listeners[i].fn.call(listeners[i].context, a1, a2, a3); break;
	        default:
	          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
	            args[j - 1] = arguments[j];
	          }

	          listeners[i].fn.apply(listeners[i].context, args);
	      }
	    }
	  }

	  return true;
	};

	/**
	 * Add a listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.on = function on(event, fn, context) {
	  return addListener(this, event, fn, context, false);
	};

	/**
	 * Add a one-time listener for a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn The listener function.
	 * @param {*} [context=this] The context to invoke the listener with.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.once = function once(event, fn, context) {
	  return addListener(this, event, fn, context, true);
	};

	/**
	 * Remove the listeners of a given event.
	 *
	 * @param {(String|Symbol)} event The event name.
	 * @param {Function} fn Only remove the listeners that match this function.
	 * @param {*} context Only remove the listeners that have this context.
	 * @param {Boolean} once Only remove one-time listeners.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
	  var evt = prefix ? prefix + event : event;

	  if (!this._events[evt]) return this;
	  if (!fn) {
	    clearEvent(this, evt);
	    return this;
	  }

	  var listeners = this._events[evt];

	  if (listeners.fn) {
	    if (
	      listeners.fn === fn &&
	      (!once || listeners.once) &&
	      (!context || listeners.context === context)
	    ) {
	      clearEvent(this, evt);
	    }
	  } else {
	    for (var i = 0, events = [], length = listeners.length; i < length; i++) {
	      if (
	        listeners[i].fn !== fn ||
	        (once && !listeners[i].once) ||
	        (context && listeners[i].context !== context)
	      ) {
	        events.push(listeners[i]);
	      }
	    }

	    //
	    // Reset the array, or remove it completely if we have no more listeners.
	    //
	    if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
	    else clearEvent(this, evt);
	  }

	  return this;
	};

	/**
	 * Remove all listeners, or those of the specified event.
	 *
	 * @param {(String|Symbol)} [event] The event name.
	 * @returns {EventEmitter} `this`.
	 * @public
	 */
	EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
	  var evt;

	  if (event) {
	    evt = prefix ? prefix + event : event;
	    if (this._events[evt]) clearEvent(this, evt);
	  } else {
	    this._events = new Events();
	    this._eventsCount = 0;
	  }

	  return this;
	};

	//
	// Alias methods names because people roll like that.
	//
	EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
	EventEmitter.prototype.addListener = EventEmitter.prototype.on;

	//
	// Expose the prefix.
	//
	EventEmitter.prefixed = prefix;

	//
	// Allow `EventEmitter` to be imported as module namespace.
	//
	EventEmitter.EventEmitter = EventEmitter;

	//
	// Expose the module.
	//
	{
	  module.exports = EventEmitter;
	}
	});

	// 事件
	var Event = {
	    // 连接成功
	    OnConnected: "OnConnected",
	    // 连接失败
	    OnConnectFailed: "OnConnectionFail",
	    // 断开连接
	    OnDisconnected: "OnDisconnected",
	    // 加入到大厅
	    OnJoinedLobby: "OnJoinedLobby",
	    // 创建房间成功
	    OnCreatedRoom: "OnCreatedRoom",
	    // 创建房间失败
	    OnCreateRoomFailed: "OnCreateRoomFailed",
	    // 加入房间成功
	    OnJoinedRoom: "OnJoinedRoom",
	    // 加入房间失败
	    OnJoinRoomFailed: "OnJoinRoomFailed",
	    // 有新玩家加入房间
	    OnNewPlayerJoinedRoom: "OnNewPlayerJoinedRoom",
	    // 有玩家离开房间
	    OnPlayerLeftRoom: "OnPlayerLeftRoom",
	    // 玩家活跃属性变化
	    OnPlayerActivityChanged: "OnPlayerActivityChanged",
	    // 主机变更
	    OnMasterSwitched: "OnMasterSwitched",
	    // 离开房间
	    OnLeftRoom: "OnLeftRoom",
	    // 房间自定义属性变化
	    OnRoomCustomPropertiesChanged: "OnRoomCustomPropertiesChanged",
	    // 玩家自定义属性变化
	    OnPlayerCustomPropertiesChanged: "OnPlayerCustomPropertiesChanged",
	    // 自定义事件
	    OnEvent: "OnEvent",
	    // 错误事件
	    OnError: "OnError",
	};

	var ReceiverGroup = {
	    Others: 0,
	    All: 1,
	    MasterClient: 2,
	};

	class SendEventOptions {
	    constructor() {
	        this.cachingOption = 0;
	        this.receiverGroup = ReceiverGroup.All;
	        // this.targetActorIds = null;
	    }
	}

	class PlayObject {
	    constructor() {
	        this._data = {};
	    }

	    static newFromJSONObject(jsonObj) {
	        var obj = new PlayObject();
	        obj._data = jsonObj;
	        return obj;
	    }

	    // Setter
	    putBool(key, b) {
	        this._data[key] = b;
	    }

	    putBoolArray(key, bs) {
	        this._data[key] = bs;
	    }

	    putNumber(key, n) {
	        this._data[key] = n;
	    }

	    putNumberArray(key, ns) {
	        this._data[key] = ns;
	    }

	    putString(key, s) {
	        this._data[key] = s;
	    }

	    putStringArray(key, ss) {
	        this._data[key] = ss;
	    }

	    putNull(key) {
	        this._data[key] = null;
	    }

	    putPlayObject(key, obj) {
	        this._data[key] = obj._data;
	    }

	    putPlayArray(key, arr) {
	        this._data[key] = arr._data;
	    }

	    // Getter
	    getBool(key) {
	        return this._data[key];
	    }

	    getBoolArray(key) {
	        return this._data[key];
	    }

	    getNumber(key) {
	        return this._data[key];
	    }

	    getNumberArray(key) {
	        return this._data[key];
	    }

	    getString(key) {
	        return this._data[key];
	    }

	    getStringArray(key) {
	        return this._data[key];
	    }

	    isNull(key) {
	        return this._data[key] === null;
	    }

	    getPlayObject(key) {
	        return PlayObject.newFromJSONObject(this._data[key]);
	    }

	    getPlayArray(key) {
	        return PlayArray.newFromJSONArray(this._data[key]);
	    }

	    // 
	    getKeys() {
	        return Object.keys(this._data);
	    }

	    containsKey(key) {
	        return key in this._data;
	    }

	    size() {
	        return Object.keys(this._data).length;
	    }

	    merge(obj) {
	        if (!(obj instanceof PlayObject)) {
	            console.error("merge only support PlayObject");
	            return;
	        }
	        for (var key in obj._data) {
	            this._data[key] = obj._data[key];
	        }
	    }

	    toJson() {
	        return this._data;
	    }
	}

	class PlayArray {
	    constructor() {
	        this._data = [];
	    }

	    static newFromJSONArray(jsonArr) {
	        var arr = new PlayArray();
	        arr._data = jsonArr;
	        return arr;
	    }

	    // add
	    addBool(b) {
	        this._data.push(b);
	    }

	    addBoolArray(bs) {
	        this._data.push(bs);
	    }

	    addNumber(n) {
	        this._data.push(n);
	    }

	    addNumberArray(ns) {
	        this._data.push(ns);
	    }

	    addString(s) {
	        this._data.push(s);
	    }

	    addStringArray(ss) {
	        this._data.push(ss);
	    }

	    addNull() {
	        this._data.push(null);
	    }

	    addPlayObject(obj) {
	        this._data.push(obj._data);
	    }

	    addPlayArray(arr) {
	        this._data.push(arr._data);
	    }

	    // get
	    getBool(i) {
	        return this._data[i];
	    }

	    getBoolArray(i) {
	        return this._data[i];
	    }

	    getNumber(i) {
	        return this._data[i];
	    }

	    getNumberArray(i) {
	        return this._data[i];
	    }

	    getString(i) {
	        return this._data[i];
	    }

	    getStringArray(i) {
	        return this._data[i];
	    }

	    isNull(i) {
	        return this._data[i] === null;
	    }

	    getPlayObject(i) {
	        return PlayObject.newFromJSONObject(this._data[i]);
	    }

	    getPlayArray(i) {
	        return PlayArray.newFromJSONArray(this._data[i]);
	    }

	    //
	    contains(obj) {
	        if ((obj instanceof PlayArray) || (obj instanceof PlayObject)) {
	            console.error('PlayArray and PlayObject are not support!');
	            return false;
	        }
	        for (var i = 0; i < this._data.length; i++) {
	            var d = this._data[i];
	            if (d === obj) {
	                return true;
	            }
	        }
	        return false;
	    }

	    size() {
	        return Object.keys(this._data).length;
	    }

	    toJson() {
	        return this._data;
	    }
	}

	class Player {
	    constructor(play) {
	        this.play = play;
	        this.userId = '';
	        this.actorId = -1;
	    }

	    static newFromJSONObject(play, playerJSONObject) {
	        var player = new Player(play);
	        player.initWithJSONObject(playerJSONObject);
	        return player;
	    }

	    initWithJSONObject(playerJSONObject) {
	        this.userId = playerJSONObject.pid;
	        this.actorId = playerJSONObject.actorId;
	        if (playerJSONObject.properties) {
	            this.properties = PlayObject.newFromJSONObject(playerJSONObject.properties);
	        } else {
	            this.properties = new PlayObject();
	        }
	    }

	    // 判断是不是当前客户端玩家
	    isLocal() {
	        return this.play.actorId === this.actorId;
	    }

	    // 判断是不是主机玩家
	    isMaster() {
	        return this.play.masterActorId === this.actorId;
	    }

	    // 判断是不是活跃状态
	    isInActive() {
	        return this.inActive;
	    }

	    // 设置活跃状态
	    setActive(active) {
	        this.inActive = !active;
	    }

	    // 设置自定义属性接口
	    setCustomProperties(properties, expectedValues = null) {
	        this.play.setPlayerCustomProperties(this.actorId, properties, expectedValues);
	    }

	    getCustomProperties() {
	        return this.properties;
	    }

	    mergeProperties(changedProperties) {
	        var changedPropsObj = PlayObject.newFromJSONObject(changedProperties);
	        this.properties.merge(changedPropsObj);
	    }
	}

	class Room {
	    constructor(play) {
	        this.play = play;
	    }

	    static newFromJSONObject(play, roomJSONObject) {
	        var room = new Room(play);
	        room.name = roomJSONObject.cid;
	        room.opened = roomJSONObject.open;
	        room.visible = roomJSONObject.visible;
	        room.maxPlayerCount = roomJSONObject.maxMembers;
	        room.masterActorId = roomJSONObject.masterActorId;
	        room.expectedUserIds = roomJSONObject.expectMembers;
	        room.players = {};
	        for (var i = 0; i < roomJSONObject.members.length; i++) {
	            var playerDTO = roomJSONObject.members[i];
	            var player = Player.newFromJSONObject(play, playerDTO);
	            if (player.userId === play.userId) {
	                play.player = player;
	            }
	            room.players[player.actorId] = player;
	        }
	        if (roomJSONObject.attr) {
	            room.properties = PlayObject.newFromJSONObject(roomJSONObject.attr);
	        } else {
	            room.properties = new PlayObject();
	        }
	        return room;
	    }

	    addPlayer(newPlayer) {
	        this.players[newPlayer.actorId] = newPlayer;
	    }

	    removePlayer(actorId) {
	        delete this.players[actorId];
	    }

	    getPlayer(actorId) {
	        var player = this.players[actorId];
	        if (player === null) {
	            console.error("not found player: " + actorId);
	        }
	        return player;
	    }

	    getPlayerList() {
	        var playerList = new Array();
	        for (var key in this.players) {
	            var player = this.players[key];
	            playerList.push(player);
	        }
	        return playerList;
	    }

	    setMasterId(newMasterId) {
	        this.masterActorId = newMasterId;
	    }

	    setOpened(opened) {
	        this.opened = opened;
	    }

	    setVisible(visible) {
	        this.visible = visible;
	    }

	    setCustomProperties(properties, expectedValues = null) {
	        this.play.setRoomCustomProperties(properties, expectedValues);
	    }

	    getCustomProperties() {
	        return this.properties;
	    }

	    mergeProperties(changedProperties) {
	        var changedPropsObj = PlayObject.newFromJSONObject(changedProperties);
	        this.properties.merge(changedPropsObj);
	    }
	}

	const MAX_PLAYER_COUNT = 10;

	class RoomOptions {
	    constructor() {
	        this.opened = true;
	        this.visible = true;
	        this.emptyRoomTtl = 0;
	        this.playerTtl = 0;
	        this.maxPlayerCount = 10;
	        this.customRoomProperties = null;
	        this.customRoomPropertiesForLobby = null;
	    }

	    toMsg() {
	        var options = {};
	        if (!this.opened)
	            options.open = this.opened;
	        if (!this.visible)
	            options.visible = this.visible;
	        if (this.emptyRoomTtl > 0) 
	            options.emptyRoomTtl = this.emptyRoomTtl;
	        if (this.playerTtl > 0) 
	            options.playerTtl = this.playerTtl;
	        if (this.maxPlayerCount > 0 && this.maxPlayerCount < MAX_PLAYER_COUNT)
	            options.maxMembers = this.maxPlayerCount;
	        if (this.customRoomProperties)
	            options.attr = this.customRoomProperties.toJson();
	        if (this.customRoomPropertiesForLobby)
	            options.lobbyAttrKeys = this.customRoomPropertiesForLobby;
	        return options;
	    }
	}

	class MasterRoom {
	    constructor(masterRoomDTO) {
	        this.roomName = masterRoomDTO.cid;
	        this.addr = masterRoomDTO.addr;
	        this.secureAddr = masterRoomDTO.secureAddr;
	        // 这些属性有必要提供吗？
	        var roomDTO = masterRoomDTO.room;
	        
	    }
	}

	function handleErrorMsg(play, msg) {
	    console.error('error: ' + JSON.stringify(msg));
	    play.emit(Event.OnError, msg.code, msg.detail);
	}

	// 大厅消息处理
	function handleMasterMsg(play, message) {
	    var msg = JSON.parse(message.data);
	    console.log(play.userId + " Lobby msg: " + msg.op + " <- " + message.data);
	    switch (msg.cmd) {
	        case "session": {
	            switch (msg.op) {
	                case "opened":
	                    handleMasterServerSessionOpen(play, msg);
	                break;
	                default:
	                    console.error("no handler for lobby msg: " + msg.op);
	                break;
	            }
	        }
	        break;
	        case "conv": {
	            switch (msg.op) {
	                case "results":
	                    handleRoomList(play, msg);
	                break;
	                case "started":
	                    handleCreateGameServer(play, msg);
	                break;
	                case "added":
	                    handleJoinGameServer(play, msg);
	                break;
	                case 'random-added':
	                    handleJoinGameServer(play, msg);
	                break;
	                default:
	                    console.error("no handler for lobby msg: " + msg.op);
	                break;
	            }
	        }
	        break;
	        case "events":
	            // TODO

	        break;
	        case "error": {
	            handleErrorMsg(play, msg);
	        }
	        break;
	        default:
	            if (msg.cmd) {
	                console.error("no handler for lobby msg: " + msg.cmd);
	            }
	        break;
	    }
	}

	// 连接建立
	function handleMasterServerSessionOpen(play, msg) {
	    play._sessionToken = msg.st;
	    var player = new Player(play);
	    player.userId = play.userId;
	    play.player = player;
	    play.emit(Event.OnJoinedLobby);
	}

	// 房间列表更新
	function handleRoomList(play, msg) {
	    play.masterRoomList = [];
	    for (var i = 0; i < msg.rooms.length; i++) {
	        var masterRoomDTO = msg.rooms[i];
	        play.masterRoomList[i] = new MasterRoom(masterRoomDTO);
	    }
	}

	// 创建房间
	function handleCreateGameServer(play, msg) {
	    if (msg.reasonCode) {
	        var code = msg.reasonCode;
	        var detail = msg.detail;
	        play.emit(Event.OnCreateRoomFailed, code, detail);
	    } else {
	        play._cachedRoomMsg.op = "start";
	        handleGameServer(play, msg);
	    }
	}

	// 加入房间
	function handleJoinGameServer(play, msg) {
	    if (msg.reasonCode) {
	        var code = msg.reasonCode;
	        var detail = msg.detail;
	        play.emit(Event.OnJoinRoomFailed, code, detail);
	    } else {
	        play._cachedRoomMsg.op = "add";
	        handleGameServer(play, msg);
	    }
	}

	function handleGameServer(play, msg) {
	    play._gameAddr = msg.addr;
	    play._secureGameAddr = msg.secureAddr;
	    if (msg.cid)
	        play._cachedRoomMsg.cid = msg.cid;
	    play.connectToGame();
	}

	function handleGameMsg(play, message) {
	    var msg = JSON.parse(message.data);
	    console.log(play.userId + " Game msg: " + msg.op + " <- " + message.data);
	    switch (msg.cmd) {
	        case "session":
	            switch (msg.op) {
	                case "opened":
	                    handleGameServerSessionOpen(play, msg);
	                break;
	                default:
	                    console.error("no handler for op: " + msg.op);
	                break;
	            }
	        break;
	        case "conv":
	            switch (msg.op) {
	                case "started":
	                    handleCreatedRoom(play, msg);
	                break;
	                case "added":
	                    handleJoinedRoom(play, msg);
	                break;
	                case "members-joined":
	                    handleNewPlayerJoinedRoom(play, msg);
	                break;
	                case "members-left":
	                    handlePlayerLeftRoom(play, msg);
	                break;
	                case "master-client-changed":
	                    handleMasterChanged(play, msg);
	                break;
	                case "open":
	                    handleRoomOpenedChanged(play, msg);
	                break;
	                case "visible":
	                    handleRoomVisibleChanged(play, msg);
	                break;
	                case "updated-notify":
	                    handleRoomCustomPropertiesChanged(play, msg);
	                break;
	                case "player-props":
	                    handlePlayerCustomPropertiesChanged(play, msg);
	                break;
	                case "members-offline":
	                    handlePlayerOffline(play, msg);
	                break;
	                case "members-online":
	                    handlePlayerOnline(play, msg);
	                break;
	                case "removed":
	                    handleLeaveRoom(play, msg);
	                break;
	                case "direct":
	                    handleEvent(play, msg);
	                break;
	                default:
	                    console.log("no handler for game msg: " + msg.op);
	                break;
	            }
	        break;
	        case "direct":
	            handleEvent(play, msg);
	        break;
	        case "ack":
	            // ignore
	        break;
	        case "events":
	            // TODO

	        break;
	        case "error": 
	            handleErrorMsg(play, msg);
	        break;
	        default:
	            if (msg.cmd) {
	                console.error("no handler for cmd: " + message.data);
	            }
	        break;
	    }
	}

	// 连接建立后创建 / 加入房间
	function handleGameServerSessionOpen(play, msg) {
	    // 根据缓存加入房间的规则
	    play._cachedRoomMsg.i = play.getMsgId();
	    play.send(play._cachedRoomMsg);
	}

	// 创建房间
	function handleCreatedRoom(play, msg) {
	    if (msg.reasonCode) {
	        var code = msg.reasonCode;
	        var detail = msg.detail;
	        play.emit(Event.OnCreateRoomFailed, code, detail);
	    } else {
	        play.room = Room.newFromJSONObject(play, msg);
	        play.emit(Event.OnCreatedRoom);
	    }
	}

	// 加入房间
	function handleJoinedRoom(play, msg) {
	    if (msg.reasonCode) {
	        var code = msg.reasonCode;
	        var detail = msg.detail;
	        play.emit(Event.OnJoinRoomFailed, code, detail);
	    } else {
	        play.room = Room.newFromJSONObject(play, msg);
	        play.emit(Event.OnJoinedRoom);
	    }
	}

	// 有新玩家加入房间
	function handleNewPlayerJoinedRoom(play, msg) {
	    var newPlayer = Player.newFromJSONObject(play, msg.member);
	    play.room.addPlayer(newPlayer);
	    play.emit(Event.OnNewPlayerJoinedRoom, newPlayer);
	}

	// 有玩家离开房间
	function handlePlayerLeftRoom(play, msg) {
	    var actorId = msg.initByActor;
	    var leftPlayer = play.room.getPlayer(actorId);
	    play.room.removePlayer(actorId);
	    play.emit(Event.OnPlayerLeftRoom, leftPlayer);
	}

	// 主机切换
	function handleMasterChanged(play, msg) {
	    var masterActorId = msg.masterActorId;
	    play.room.setMasterId(masterActorId);
	    var newMaster = play.room.getPlayer(masterActorId);
	    play.emit(Event.OnMasterSwitched, newMaster);
	}

	// 房间开启 / 关闭
	function handleRoomOpenedChanged(play, msg) {
	    var opened = msg.toggle;
	    play.room.setOpened(opened);
	}

	// 房间是否可见
	function handleRoomVisibleChanged(play, msg) {
	    var visible = msg.toggle;
	    play.room.setVisible(visible);
	}

	// 房间属性变更
	function handleRoomCustomPropertiesChanged(play, msg) {
	    var changedProperties = msg.attr;
	    play.room.mergeProperties(changedProperties);
	    play.emit(Event.OnRoomCustomPropertiesChanged, changedProperties);
	}

	// 玩家属性变更
	function handlePlayerCustomPropertiesChanged(play, msg) {
	    var player = play.room.getPlayer(msg.initByActor);
	    player.mergeProperties(msg.attr);
	    play.emit(Event.OnPlayerCustomPropertiesChanged, player, msg.attr);
	}

	// 玩家下线
	function handlePlayerOffline(play, msg) {
	    var player = play.room.getPlayer(msg.initByActor);
	    player.setActive(false);
	    play.emit(Event.OnPlayerActivityChanged, player);
	}

	// 玩家上线
	function handlePlayerOnline(play, msg) {
	    var actorId = msg.member.actorId;
	    var player = play.room.getPlayer(actorId);
	    player.initWithJSONObject(msg.member);
	    player.setActive(true);
	    play.emit(Event.OnPlayerActivityChanged, player);
	}

	// 离开房间
	function handleLeaveRoom(play, msg) {
	    // 清理工作
	    play.room = null;
	    play.player = null;
	    play.emit(Event.OnLeftRoom);
	    play.connectToMaster();
	}

	// 自定义事件
	function handleEvent(play, msg) {
	    var senderId = msg.fromActorId;
	    var eventId = msg.eventId;
	    var params = PlayObject.newFromJSONObject(msg.msg);
	    play.emit(Event.OnEvent, eventId, params, senderId);
	}

	// SDK 版本号
	var PlayVersion = '0.0.1';

	class Play extends eventemitter3 {
	    static getInstance() {
	        return instance;
	    }

	    // 初始化
	    init(appId, appKey) {
	        this._appId = appId;
	        this._appKey = appKey;
	        this._masterServer = null;
	        this._msgId = 0;
	        this._requestMsg = {};
	        // 切换服务器状态
	        this._switchingServer = false;
	    }

	    // 建立连接
	    connect(gameVersion = '0.0.1') {
	        this._gameVersion = gameVersion;
	        var self = this;
	        var params = "appId=" + this._appId + "&secure=true";
	        axios$1.get("https://game-router-cn-e1.leancloud.cn/v1/router?" + params)
	        .then(function (response) {
	            var data = response.data;
	            console.log(data);
	            self._masterServer = data.server;
	            self.connectToMaster();
	        })
	        .catch(function (error) {
	            console.log(error);
	        });
	    }

	    // 重连
	    reconnect() {
	        this.connectToMaster();
	    }

	    // 重连并重新加入房间
	    reconnectAndRejoin() {
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	            cid: this._cachedRoomMsg.cid,
	            rejoin: true,
	        };
	        this.connectToGame();
	    }

	    // 断开连接
	    disconnect() {
	        this.stopKeepAlive();
	        if (this._websocket) {
	            this._websocket.close();
	            this._websocket = null;
	        }
	        console.log(this.userId + ' disconnect.');
	    }

	    // 连接至大厅服务器
	    connectToMaster() {
	        this.cleanup();
	        this._switchingServer = true;
	        var self = this;
	        this._websocket = new browser(this._masterServer);
	        this._websocket.onopen = function (evt) {
	            console.log("Lobby websocket opened");
	            self._switchingServer = false;
	            self.emit(Event.OnConnected);
	            self.sessionOpen();
	        };
	        this._websocket.onmessage = function (msg) {
	            handleMasterMsg(self, msg);
	        };
	        this._websocket.onclose = function (evt) {
	            console.log("Lobby websocket closed");
	            if (!self._switchingServer) {
	                self.emit(Event.OnDisconnected);
	            }
	        };
	        this._websocket.onerror = function (evt) {
	            console.error(evt);
	        };
	    }

	    // 连接至游戏服务器
	    connectToGame() {
	        this.cleanup();
	        this._switchingServer = true;
	        var self = this;
	        this._websocket = new browser(this._secureGameAddr);
	        this._websocket.onopen = function (evt) {
	            console.log("Game websocket opened");
	            self._switchingServer = false;
	            self.sessionOpen();
	        };
	        this._websocket.onmessage = function (msg) {
	            handleGameMsg(self, msg);
	        };
	        this._websocket.onclose = function (evt) {
	            console.log("Game websocket closed");
	            if (!self._switchingServer) {
	                self.emit(Event.OnDisconnected);
	            }
	            self.stopKeepAlive();
	        };
	        this._websocket.onerror = function (evt) {
	            console.error(evt);
	        };
	    }

	    // TODO 获取房间列表
	    getRoomList() {
	        var msg = {
	            cmd: "conv",
	            op: "scan-lobby",
	            i: this.getMsgId(),
	            limit: 100,
	        };
	        this.send(msg);
	    }

	    // 创建房间
	    createRoom(roomName, options = null, expectedUserIds = null) {
	        if (options !== null && !(options instanceof RoomOptions)) {
	            console.error("options must be RoomOptions");
	            return;
	        }
	        if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
	            console.error('expectedUserIds must be Array with string');
	            return;
	        }
	        // 缓存 GameServer 创建房间的消息体
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "start",
	            i: this.getMsgId(),
	            cid: roomName,
	        };
	        // 拷贝房间属性（包括 系统属性和玩家定义属性）
	        if (options) {
	            var opts = options.toMsg();
	            for (var k in opts) {
	                this._cachedRoomMsg[k] = opts[k];
	            }
	        }
	        if (expectedUserIds) {
	            this._cachedRoomMsg.expectMembers = expectedUserIds;
	        }
	        // Router 创建房间的消息体
	        var msg = this._cachedRoomMsg;
	        this.send(msg);
	    }

	    // 指定房间名加入房间
	    // 可选：期望好友 IDs
	    joinRoom(roomName, expectedUserIds = null) {
	        if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
	            console.error('expectedUserIds must be Array with string');
	            return;
	        }
	        // 加入房间的消息体
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	            cid: roomName,
	        };
	        if (expectedUserIds) {
	            this._cachedRoomMsg.expectMembers = expectedUserIds;
	        }
	        var msg = this._cachedRoomMsg;
	        this.send(msg);
	    }

	    // 重新加入房间
	    rejoinRoom(roomName) {
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	            cid: roomName,
	            rejoin: true,
	        };
	        var msg = this._cachedRoomMsg;
	        this.send(msg);
	    }

	    // 随机加入或创建房间
	    joinOrCreateRoom(roomName, options = null, expectedUserIds = null) {
	        if (options !== null && !(options instanceof RoomOptions)) {
	            console.error("options must be RoomOptions");
	            return;
	        }
	        if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
	            console.error('expectedUserIds must be Array with string');
	            return;
	        }
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	            cid: roomName,
	        };
	        // 拷贝房间参数
	        if (options != null) {
	            var opts = options.toMsg();
	            for (var k in opts) {
	                this._cachedRoomMsg[k] = opts[k];
	            }
	        }
	        if (expectedUserIds) {
	            this._cachedRoomMsg.expectMembers = expectedUserIds;
	        }
	        var msg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	            cid: roomName,
	            createOnNotFound: true,
	        };
	        if (expectedUserIds) {
	            msg.expectMembers = expectedUserIds;
	        }
	        this.send(msg);
	    }

	    // 随机加入房间
	    joinRandomRoom(matchProperties = null, expectedUserIds = null) {
	        if (matchProperties !== null && !(matchProperties instanceof PlayObject)) {
	            console.error("match properties must be PlayObject");
	            return;
	        }
	        if (expectedUserIds !== null && !(expectedUserIds instanceof Array)) {
	            console.error('expectedUserIds must be Array with string');
	            return;
	        }
	        this._cachedRoomMsg = {
	            cmd: "conv",
	            op: "add",
	            i: this.getMsgId(),
	        };
	        if (matchProperties) {
	            this._cachedRoomMsg.expectAttr = matchProperties.toJson();
	        }
	        if (expectedUserIds) {
	            this._cachedRoomMsg.expectMembers = expectedUserIds;
	        }

	        var msg = {
	            cmd: "conv",
	            op: "add-random",
	        };
	        if (matchProperties) {
	            msg.expectAttr = matchProperties.toJson();
	        }
	        if (expectedUserIds) {
	            msg.expectMembers = expectedUserIds;
	        }
	        this.send(msg);
	    }

	    // 设置房间开启 / 关闭
	    setRoomOpened(opened) {
	        var msg = {
	            cmd: "conv",
	            op: "open",
	            i: this.getMsgId(),
	            toggle: opened,
	        };
	        this.this.send(msg);
	    }

	    // 设置房间可见 / 不可见
	    setRoomVisible(visible) {
	        var msg = {
	            cmd: "conv",
	            op: "visible",
	            i: this.getMsgId(),
	            toggle: visible,
	        };
	        this.send(msg);
	    }

	    // 离开房间
	    leaveRoom() {
	        var msg = {
	            cmd: "conv",
	            op: "remove",
	            i: this.getMsgId(),
	            cid: this.room.name,
	        };
	        this.send(msg);
	    }

	    // 设置房主
	    setMaster(nextMasterActorId) {
	        var msg = {
	            cmd: "conv",
	            op: "update-master-client",
	            i: this.getMsgId(),
	            masterActorId: nextMasterActorId,
	        };
	        this.send(msg);
	    }

	    // 设置房间属性
	    setRoomCustomProperties(properties, expectedValues = null) {
	        if (!(properties instanceof PlayObject)) {
	            console.error('property must be PlayObject');
	            return;
	        }
	        if (expectedValues && !(expectedValues instanceof PlayObject)) {
	            console.error('expectedValue must be PlayObject');
	            return;
	        }
	        var props = JSON.stringify(properties);
	        var msg = {
	            cmd: "conv",
	            op: "update",
	            i: this.getMsgId(),
	            attr: properties.toJson(),
	        };
	        if (expectedValues) {
	            msg.expectAttr = expectedValues.toJson();
	        }
	        this.send(msg);
	    }

	    // 设置玩家属性
	    setPlayerCustomProperties(actorId, properties, expectedValues = null) {
	        if (!(properties instanceof PlayObject)) {
	            console.error('property must be PlayObject');
	            return;
	        }
	        if (expectedValues && !(expectedValues instanceof PlayObject)) {
	            console.error('expectedValue must be PlayObject');
	            return;
	        }
	        var msg = {
	            cmd: "conv",
	            op: "update-player-prop",
	            i: this.getMsgId(),
	            targetActorId: actorId,
	            playerProperty: properties.toJson(),
	        };
	        if (expectedValues) {
	            msg.expectAttr = expectedValues.toJson();
	        }
	        this.send(msg);
	    }

	    // 发送自定义消息
	    sendEvent(eventId, eventData, options = new SendEventOptions()) {
	        if (!(eventData instanceof PlayObject)) {
	            console.error('event data must be PlayObject');
	            return;
	        }
	        var msg = {
	            cmd: "direct",
	            i: this.getMsgId(),
	            eventId: eventId,
	            msg: eventData.toJson(),
	            receiverGroup: options.receiverGroup,
	            toActorIds: options.targetActorIds,
	            cachingOption: options.cachingOption,
	        };
	        this.send(msg);
	    }

	    // 开始会话，建立连接后第一条消息
	    sessionOpen() {
	        var msg = {
	            cmd: "session",
	            op: "open",
	            i: this.getMsgId(),
	            appId: this._appId,
	            peerId: this.userId,
	            ua: PlayVersion + '_' + this._gameVersion,
	        };
	        this.send(msg);
	    }

	    // 发送消息
	    send(msg) {
	        var msgData = JSON.stringify(msg);
	        console.log(this.userId +  " msg: " + msg.op + " -> " + msgData);
	        this._websocket.send(msgData);
	        // 心跳包
	        this.stopKeepAlive();
	        var self = this;
	        this._keepAlive = setTimeout(function () {
	            var keepAliveMsg = {};
	            self.send(keepAliveMsg);
	        }, 10000);
	    }

	    getMsgId() {
	        return this._msgId++;
	    }

	    stopKeepAlive() {
	        if (this._keepAlive) {
	            clearTimeout(this._keepAlive);
	            this._keepAlive = null;
	        }
	    }

	    cleanup() {
	        if (this._websocket) {
	            this._websocket.onopen = null;
	            this._websocket.onconnect = null;
	            this._websocket.onmessage = null;
	            this._websocket.onclose = null;
	            this._websocket.close();
	            this._websocket = null;
	        }
	    }
	}
	var instance = new Play();

	exports.Play = Play;
	exports.Room = Room;
	exports.Player = Player;
	exports.Event = Event;
	exports.RoomOptions = RoomOptions;
	exports.SendEventOptions = SendEventOptions;
	exports.ReceiverGroup = ReceiverGroup;
	exports.PlayObject = PlayObject;
	exports.PlayArray = PlayArray;

	Object.defineProperty(exports, '__esModule', { value: true });

})));
