'use strict';
function parseHeaders(headers) {
	var parsed = {}, key, val, i;
	if (!headers) return parsed;
	forEach(headers.split('\n'), function (line) {
		i = line.indexOf(':');
		key = lowercase(trim(line.substr(0, i)));
		val = trim(line.substr(i + 1));
		if (key) {
			if (parsed[key]) {
				parsed[key] += ', ' + val;
			} else {
				parsed[key] = val;
			}
		}
	});
	return parsed;
}
function headersGetter(headers) {
	var headersObj = isObject(headers) ? headers : undefined;
	return function (name) {
		if (!headersObj) headersObj = parseHeaders(headers);
		if (name) {
			return headersObj[lowercase(name)] || null;
		}
		return headersObj;
	};
}
function transformData(data, headers, fns) {
	if (isFunction(fns))
		return fns(data, headers);
	forEach(fns, function (fn) {
		data = fn(data, headers);
	});
	return data;
}
function isSuccess(status) {
	return 200 <= status && status < 300;
}
function $HttpProvider() {
	var JSON_START = /^\s*(\[|\{[^\{])/,
		JSON_END = /[\}\]]\s*$/,
		PROTECTION_PREFIX = /^\)\]\}',?\n/,
		CONTENT_TYPE_APPLICATION_JSON = {'Content-Type': 'application/json;charset=utf-8'};
	var defaults = this.defaults = {
		// transform incoming response data
		transformResponse: [function (data) {
			if (isString(data)) {
				// strip json vulnerability protection prefix
				data = data.replace(PROTECTION_PREFIX, '');
				if (JSON_START.test(data) && JSON_END.test(data))
					data = fromJson(data);
			}
			return data;
		}],
		// transform outgoing request data
		transformRequest: [function (d) {
			return isObject(d) && !isFile(d) ? toJson(d) : d;
		}],
		// default headers
		headers: {
			common: {
				'Accept': 'application/json, text/plain, */*'
			},
			post: CONTENT_TYPE_APPLICATION_JSON,
			put: CONTENT_TYPE_APPLICATION_JSON,
			patch: CONTENT_TYPE_APPLICATION_JSON
		},
		xsrfCookieName: 'XSRF-TOKEN',
		xsrfHeaderName: 'X-XSRF-TOKEN'
	};
	var interceptorFactories = this.interceptors = [];
	var responseInterceptorFactories = this.responseInterceptors = [];
	this.$get = ['$httpBackend', '$browser', '$cacheFactory', '$rootScope', '$q', '$injector',
		function ($httpBackend, $browser, $cacheFactory, $rootScope, $q, $injector) {
			var defaultCache = $cacheFactory('$http');
			var reversedInterceptors = [];
			forEach(interceptorFactories, function (interceptorFactory) {
				reversedInterceptors.unshift(isString(interceptorFactory)
					? $injector.get(interceptorFactory) : $injector.invoke(interceptorFactory));
			});
			forEach(responseInterceptorFactories, function (interceptorFactory, index) {
				var responseFn = isString(interceptorFactory)
					? $injector.get(interceptorFactory)
					: $injector.invoke(interceptorFactory);
				reversedInterceptors.splice(index, 0, {
					response: function (response) {
						return responseFn($q.when(response));
					},
					responseError: function (response) {
						return responseFn($q.reject(response));
					}
				});
			});
			function $http(requestConfig) {
				var config = {
					transformRequest: defaults.transformRequest,
					transformResponse: defaults.transformResponse
				};
				var headers = mergeHeaders(requestConfig);
				extend(config, requestConfig);
				config.headers = headers;
				config.method = uppercase(config.method);
				var xsrfValue = urlIsSameOrigin(config.url)
					? $browser.cookies()[config.xsrfCookieName || defaults.xsrfCookieName]
					: undefined;
				if (xsrfValue) {
					headers[(config.xsrfHeaderName || defaults.xsrfHeaderName)] = xsrfValue;
				}
				var serverRequest = function (config) {
					headers = config.headers;
					var reqData = transformData(config.data, headersGetter(headers), config.transformRequest);
					// strip content-type if data is undefined
					if (isUndefined(config.data)) {
						forEach(headers, function (value, header) {
							if (lowercase(header) === 'content-type') {
								delete headers[header];
							}
						});
					}
					if (isUndefined(config.withCredentials) && !isUndefined(defaults.withCredentials)) {
						config.withCredentials = defaults.withCredentials;
					}
					// send request
					return sendReq(config, reqData, headers).then(transformResponse, transformResponse);
				};
				var chain = [serverRequest, undefined];
				var promise = $q.when(config);
				// apply interceptors
				forEach(reversedInterceptors, function (interceptor) {
					if (interceptor.request || interceptor.requestError) {
						chain.unshift(interceptor.request, interceptor.requestError);
					}
					if (interceptor.response || interceptor.responseError) {
						chain.push(interceptor.response, interceptor.responseError);
					}
				});
				while (chain.length) {
					var thenFn = chain.shift();
					var rejectFn = chain.shift();
					promise = promise.then(thenFn, rejectFn);
				}
				promise.success = function (fn) {
					promise.then(function (response) {
						fn(response.data, response.status, response.headers, config);
					});
					return promise;
				};
				promise.error = function (fn) {
					promise.then(null, function (response) {
						fn(response.data, response.status, response.headers, config);
					});
					return promise;
				};
				return promise;
				function transformResponse(response) {
					// make a copy since the response must be cacheable
					var resp = extend({}, response, {
						data: transformData(response.data, response.headers, config.transformResponse)
					});
					return (isSuccess(response.status))
						? resp
						: $q.reject(resp);
				}

				function mergeHeaders(config) {
					var defHeaders = defaults.headers,
						reqHeaders = extend({}, config.headers),
						defHeaderName, lowercaseDefHeaderName, reqHeaderName;
					defHeaders = extend({}, defHeaders.common, defHeaders[lowercase(config.method)]);
					// execute if header value is function
					execHeaders(defHeaders);
					execHeaders(reqHeaders);
					// using for-in instead of forEach to avoid unecessary iteration after header has been found
					defaultHeadersIteration:
						for (defHeaderName in defHeaders) {
							lowercaseDefHeaderName = lowercase(defHeaderName);
							for (reqHeaderName in reqHeaders) {
								if (lowercase(reqHeaderName) === lowercaseDefHeaderName) {
									continue defaultHeadersIteration;
								}
							}
							reqHeaders[defHeaderName] = defHeaders[defHeaderName];
						}
					return reqHeaders;
					function execHeaders(headers) {
						var headerContent;
						forEach(headers, function (headerFn, header) {
							if (isFunction(headerFn)) {
								headerContent = headerFn();
								if (headerContent != null) {
									headers[header] = headerContent;
								} else {
									delete headers[header];
								}
							}
						});
					}
				}
			}

			$http.pendingRequests = [];
			createShortMethods('get', 'delete', 'head', 'jsonp');
			createShortMethodsWithData('post', 'put');
			$http.defaults = defaults;
			return $http;
			function createShortMethods(names) {
				forEach(arguments, function (name) {
					$http[name] = function (url, config) {
						return $http(extend(config || {}, {
							method: name,
							url: url
						}));
					};
				});
			}

			function createShortMethodsWithData(name) {
				forEach(arguments, function (name) {
					$http[name] = function (url, data, config) {
						return $http(extend(config || {}, {
							method: name,
							url: url,
							data: data
						}));
					};
				});
			}

			function sendReq(config, reqData, reqHeaders) {
				var deferred = $q.defer(),
					promise = deferred.promise,
					cache,
					cachedResp,
					url = buildUrl(config.url, config.params);
				$http.pendingRequests.push(config);
				promise.then(removePendingReq, removePendingReq);
				if ((config.cache || defaults.cache) && config.cache !== false && config.method == 'GET') {
					cache = isObject(config.cache) ? config.cache
						: isObject(defaults.cache) ? defaults.cache
						: defaultCache;
				}
				if (cache) {
					cachedResp = cache.get(url);
					if (isDefined(cachedResp)) {
						if (cachedResp.then) {
							// cached request has already been sent, but there is no response yet
							cachedResp.then(removePendingReq, removePendingReq);
							return cachedResp;
						} else {
							// serving from cache
							if (isArray(cachedResp)) {
								resolvePromise(cachedResp[1], cachedResp[0], copy(cachedResp[2]));
							} else {
								resolvePromise(cachedResp, 200, {});
							}
						}
					} else {
						// put the promise for the non-transformed response into cache as a placeholder
						cache.put(url, promise);
					}
				}
				// if we won't have the response in cache, send the request to the backend
				if (isUndefined(cachedResp)) {
					$httpBackend(config.method, url, reqData, done, reqHeaders, config.timeout,
						config.withCredentials, config.responseType);
				}
				return promise;
				function done(status, response, headersString) {
					if (cache) {
						if (isSuccess(status)) {
							cache.put(url, [status, response, parseHeaders(headersString)]);
						} else {
							// remove promise from the cache
							cache.remove(url);
						}
					}
					resolvePromise(response, status, headersString);
					if (!$rootScope.$$phase) $rootScope.$apply();
				}

				function resolvePromise(response, status, headers) {
					// normalize internal statuses to 0
					status = Math.max(status, 0);
					(isSuccess(status) ? deferred.resolve : deferred.reject)({
						data: response,
						status: status,
						headers: headersGetter(headers),
						config: config
					});
				}

				function removePendingReq() {
					var idx = indexOf($http.pendingRequests, config);
					if (idx !== -1) $http.pendingRequests.splice(idx, 1);
				}
			}

			function buildUrl(url, params) {
				if (!params) return url;
				var parts = [];
				forEachSorted(params, function (value, key) {
					if (value === null || isUndefined(value)) return;
					if (!isArray(value)) value = [value];
					forEach(value, function (v) {
						if (isObject(v)) {
							v = toJson(v);
						}
						parts.push(encodeUriQuery(key) + '=' +
							encodeUriQuery(v));
					});
				});
				return url + ((url.indexOf('?') == -1) ? '?' : '&') + parts.join('&');
			}
		}];
}
