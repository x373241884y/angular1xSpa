'use strict';
var PATH_MATCH = /^([^\?#]*)(\?([^#]*))?(#(.*))?$/,
	DEFAULT_PORTS = {'http': 80, 'https': 443, 'ftp': 21};
var $locationMinErr = minErr('$location');
function encodePath(path) {
	var segments = path.split('/'),
		i = segments.length;
	while (i--) {
		segments[i] = encodeUriSegment(segments[i]);
	}
	return segments.join('/');
}
function parseAbsoluteUrl(absoluteUrl, locationObj, appBase) {
	var parsedUrl = urlResolve(absoluteUrl, appBase);
	locationObj.$$protocol = parsedUrl.protocol;
	locationObj.$$host = parsedUrl.hostname;
	locationObj.$$port = int(parsedUrl.port) || DEFAULT_PORTS[parsedUrl.protocol] || null;
}
function parseAppUrl(relativeUrl, locationObj, appBase) {
	var prefixed = (relativeUrl.charAt(0) !== '/');
	if (prefixed) {
		relativeUrl = '/' + relativeUrl;
	}
	var match = urlResolve(relativeUrl, appBase);
	locationObj.$$path = decodeURIComponent(prefixed && match.pathname.charAt(0) === '/' ?
		match.pathname.substring(1) : match.pathname);
	locationObj.$$search = parseKeyValue(match.search);
	locationObj.$$hash = decodeURIComponent(match.hash);
	// make sure path starts with '/';
	if (locationObj.$$path && locationObj.$$path.charAt(0) != '/') {
		locationObj.$$path = '/' + locationObj.$$path;
	}
}
function beginsWith(begin, whole) {
	if (whole.indexOf(begin) === 0) {
		return whole.substr(begin.length);
	}
}
function stripHash(url) {
	var index = url.indexOf('#');
	return index == -1 ? url : url.substr(0, index);
}
function stripFile(url) {
	return url.substr(0, stripHash(url).lastIndexOf('/') + 1);
}
function serverBase(url) {
	return url.substring(0, url.indexOf('/', url.indexOf('//') + 2));
}
function LocationHtml5Url(appBase, basePrefix) {
	this.$$html5 = true;
	basePrefix = basePrefix || '';
	var appBaseNoFile = stripFile(appBase);
	parseAbsoluteUrl(appBase, this, appBase);
	this.$$parse = function (url) {
		var pathUrl = beginsWith(appBaseNoFile, url);
		if (!isString(pathUrl)) {
			throw $locationMinErr('ipthprfx', 'Invalid url "{0}", missing path prefix "{1}".', url,
				appBaseNoFile);
		}
		parseAppUrl(pathUrl, this, appBase);
		if (!this.$$path) {
			this.$$path = '/';
		}
		this.$$compose();
	};
	this.$$compose = function () {
		var search = toKeyValue(this.$$search),
			hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';
		this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
		this.$$absUrl = appBaseNoFile + this.$$url.substr(1); // first char is always '/'
	};
	this.$$rewrite = function (url) {
		var appUrl, prevAppUrl;
		if ((appUrl = beginsWith(appBase, url)) !== undefined) {
			prevAppUrl = appUrl;
			if ((appUrl = beginsWith(basePrefix, appUrl)) !== undefined) {
				return appBaseNoFile + (beginsWith('/', appUrl) || appUrl);
			} else {
				return appBase + prevAppUrl;
			}
		} else if ((appUrl = beginsWith(appBaseNoFile, url)) !== undefined) {
			return appBaseNoFile + appUrl;
		} else if (appBaseNoFile == url + '/') {
			return appBaseNoFile;
		}
	};
}
function LocationHashbangUrl(appBase, hashPrefix) {
	var appBaseNoFile = stripFile(appBase);
	parseAbsoluteUrl(appBase, this, appBase);
	this.$$parse = function (url) {
		var withoutBaseUrl = beginsWith(appBase, url) || beginsWith(appBaseNoFile, url);
		var withoutHashUrl = withoutBaseUrl.charAt(0) == '#'
			? beginsWith(hashPrefix, withoutBaseUrl)
			: (this.$$html5)
			? withoutBaseUrl
			: '';
		if (!isString(withoutHashUrl)) {
			throw $locationMinErr('ihshprfx', 'Invalid url "{0}", missing hash prefix "{1}".', url,
				hashPrefix);
		}
		parseAppUrl(withoutHashUrl, this, appBase);
		this.$$path = removeWindowsDriveName(this.$$path, withoutHashUrl, appBase);
		this.$$compose();
		function removeWindowsDriveName(path, url, base) {
			var windowsFilePathExp = /^\/?.*?:(\/.*)/;
			var firstPathSegmentMatch;
			//Get the relative path from the input URL.
			if (url.indexOf(base) === 0) {
				url = url.replace(base, '');
			}
			if (windowsFilePathExp.exec(url)) {
				return path;
			}
			firstPathSegmentMatch = windowsFilePathExp.exec(path);
			return firstPathSegmentMatch ? firstPathSegmentMatch[1] : path;
		}
	};
	this.$$compose = function () {
		var search = toKeyValue(this.$$search),
			hash = this.$$hash ? '#' + encodeUriSegment(this.$$hash) : '';
		this.$$url = encodePath(this.$$path) + (search ? '?' + search : '') + hash;
		this.$$absUrl = appBase + (this.$$url ? hashPrefix + this.$$url : '');
	};
	this.$$rewrite = function (url) {
		if (stripHash(appBase) == stripHash(url)) {
			return url;
		}
	};
}
function LocationHashbangInHtml5Url(appBase, hashPrefix) {
	this.$$html5 = true;
	LocationHashbangUrl.apply(this, arguments);
	var appBaseNoFile = stripFile(appBase);
	this.$$rewrite = function (url) {
		var appUrl;
		if (appBase == stripHash(url)) {
			return url;
		} else if ((appUrl = beginsWith(appBaseNoFile, url))) {
			return appBase + hashPrefix + appUrl;
		} else if (appBaseNoFile === url + '/') {
			return appBaseNoFile;
		}
	};
}
LocationHashbangInHtml5Url.prototype =
	LocationHashbangUrl.prototype =
		LocationHtml5Url.prototype = {
			$$html5: false,
			$$replace: false,
			absUrl: locationGetter('$$absUrl'),
			url: function (url, replace) {
				if (isUndefined(url))
					return this.$$url;
				var match = PATH_MATCH.exec(url);
				if (match[1]) this.path(decodeURIComponent(match[1]));
				if (match[2] || match[1]) this.search(match[3] || '');
				this.hash(match[5] || '', replace);
				return this;
			},
			protocol: locationGetter('$$protocol'),
			host: locationGetter('$$host'),
			port: locationGetter('$$port'),
			path: locationGetterSetter('$$path', function (path) {
				return path.charAt(0) == '/' ? path : '/' + path;
			}),
			search: function (search, paramValue) {
				switch (arguments.length) {
					case 0:
						return this.$$search;
					case 1:
						if (isString(search)) {
							this.$$search = parseKeyValue(search);
						} else if (isObject(search)) {
							this.$$search = search;
						} else {
							throw $locationMinErr('isrcharg',
								'The first argument of the `$location#search()` call must be a string or an object.');
						}
						break;
					default:
						if (isUndefined(paramValue) || paramValue === null) {
							delete this.$$search[search];
						} else {
							this.$$search[search] = paramValue;
						}
				}
				this.$$compose();
				return this;
			},
			hash: locationGetterSetter('$$hash', identity),
			replace: function () {
				this.$$replace = true;
				return this;
			}
		};
function locationGetter(property) {
	return function () {
		return this[property];
	};
}
function locationGetterSetter(property, preprocess) {
	return function (value) {
		if (isUndefined(value))
			return this[property];
		this[property] = preprocess(value);
		this.$$compose();
		return this;
	};
}
function $LocationProvider() {
	var hashPrefix = '',
		html5Mode = false;
	this.hashPrefix = function (prefix) {
		if (isDefined(prefix)) {
			hashPrefix = prefix;
			return this;
		} else {
			return hashPrefix;
		}
	};
	this.html5Mode = function (mode) {
		if (isDefined(mode)) {
			html5Mode = mode;
			return this;
		} else {
			return html5Mode;
		}
	};
	this.$get = ['$rootScope', '$browser', '$sniffer', '$rootElement',
		function ($rootScope, $browser, $sniffer, $rootElement) {
			var $location,
				LocationMode,
				baseHref = $browser.baseHref(), // if base[href] is undefined, it defaults to ''
				initialUrl = $browser.url(),
				appBase;
			if (html5Mode) {
				appBase = serverBase(initialUrl) + (baseHref || '/');
				LocationMode = $sniffer.history ? LocationHtml5Url : LocationHashbangInHtml5Url;
			} else {
				appBase = stripHash(initialUrl);
				LocationMode = LocationHashbangUrl;
			}
			$location = new LocationMode(appBase, '#' + hashPrefix);
			$location.$$parse($location.$$rewrite(initialUrl));
			$rootElement.on('click', function (event) {
				// TODO(vojta): rewrite link when opening in new tab/window (in legacy browser)
				// currently we open nice url link and redirect then
				if (event.ctrlKey || event.metaKey || event.which == 2) return;
				var elm = jqLite(event.target);
				// traverse the DOM up to find first A tag
				while (lowercase(elm[0].nodeName) !== 'a') {
					// ignore rewriting if no A tag (reached root element, or no parent - removed from document)
					if (elm[0] === $rootElement[0] || !(elm = elm.parent())[0]) return;
				}
				var absHref = elm.prop('href');
				var rewrittenUrl = $location.$$rewrite(absHref);
				if (absHref && !elm.attr('target') && rewrittenUrl && !event.isDefaultPrevented()) {
					event.preventDefault();
					if (rewrittenUrl != $browser.url()) {
						// update location manually
						$location.$$parse(rewrittenUrl);
						$rootScope.$apply();
						// hack to work around FF6 bug 684208 when scenario runner clicks on links
						window.angular['ff-684208-preventDefault'] = true;
					}
				}
			});
			// rewrite hashbang url <> html5 url
			if ($location.absUrl() != initialUrl) {
				$browser.url($location.absUrl(), true);
			}
			// update $location when $browser url changes
			$browser.onUrlChange(function (newUrl) {
				if ($location.absUrl() != newUrl) {
					if ($rootScope.$broadcast('$locationChangeStart', newUrl,
							$location.absUrl()).defaultPrevented) {
						$browser.url($location.absUrl());
						return;
					}
					$rootScope.$evalAsync(function () {
						var oldUrl = $location.absUrl();
						$location.$$parse(newUrl);
						afterLocationChange(oldUrl);
					});
					if (!$rootScope.$$phase) $rootScope.$digest();
				}
			});
			// update browser
			var changeCounter = 0;
			$rootScope.$watch(function $locationWatch() {
				var oldUrl = $browser.url();
				var currentReplace = $location.$$replace;
				if (!changeCounter || oldUrl != $location.absUrl()) {
					changeCounter++;
					$rootScope.$evalAsync(function () {
						if ($rootScope.$broadcast('$locationChangeStart', $location.absUrl(), oldUrl).
								defaultPrevented) {
							$location.$$parse(oldUrl);
						} else {
							$browser.url($location.absUrl(), currentReplace);
							afterLocationChange(oldUrl);
						}
					});
				}
				$location.$$replace = false;
				return changeCounter;
			});
			return $location;
			function afterLocationChange(oldUrl) {
				$rootScope.$broadcast('$locationChangeSuccess', $location.absUrl(), oldUrl);
			}
		}];
}
