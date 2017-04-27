'use strict';
function Browser(window, document, $log, $sniffer) {
	var self = this,
		rawDocument = document[0],
		location = window.location,
		history = window.history,
		setTimeout = window.setTimeout,
		clearTimeout = window.clearTimeout,
		pendingDeferIds = {};
	self.isMock = false;
	var outstandingRequestCount = 0;
	var outstandingRequestCallbacks = [];

	self.$$completeOutstandingRequest = completeOutstandingRequest;
	self.$$incOutstandingRequestCount = function () {
		outstandingRequestCount++;
	};
	function completeOutstandingRequest(fn) {
		try {
			fn.apply(null, sliceArgs(arguments, 1));
		} finally {
			outstandingRequestCount--;
			if (outstandingRequestCount === 0) {
				while (outstandingRequestCallbacks.length) {
					try {
						outstandingRequestCallbacks.pop()();
					} catch (e) {
						$log.error(e);
					}
				}
			}
		}
	}

	self.notifyWhenNoOutstandingRequests = function (callback) {

		forEach(pollFns, function (pollFn) {
			pollFn();
		});
		if (outstandingRequestCount === 0) {
			callback();
		} else {
			outstandingRequestCallbacks.push(callback);
		}
	};


	var pollFns = [],
		pollTimeout;
	self.addPollFn = function (fn) {
		if (isUndefined(pollTimeout)) {
			startPoller(100, setTimeout);
		}
		pollFns.push(fn);
		return fn;
	};
	function startPoller(interval, setTimeout) {
		(function check() {
			forEach(pollFns, function (pollFn) {
				pollFn();
			});
			pollTimeout = setTimeout(check, interval);
		})();
	}


	var lastBrowserUrl = location.href,
		baseElement = document.find('base'),
		newLocation = null;
	self.url = function (url, replace) {

		if (location !== window.location) location = window.location;

		if (url) {
			if (lastBrowserUrl == url) return;
			lastBrowserUrl = url;
			if ($sniffer.history) {
				if (replace) history.replaceState(null, '', url);
				else {
					history.pushState(null, '', url);

					baseElement.attr('href', baseElement.attr('href'));
				}
			} else {
				newLocation = url;
				if (replace) {
					location.replace(url);
				} else {
					location.href = url;
				}
			}
			return self;

		} else {


			return newLocation || location.href.replace(/%27/g, "'");
		}
	};
	var urlChangeListeners = [],
		urlChangeInit = false;

	function fireUrlChange() {
		newLocation = null;
		if (lastBrowserUrl == self.url()) return;
		lastBrowserUrl = self.url();
		forEach(urlChangeListeners, function (listener) {
			listener(self.url());
		});
	}

	self.onUrlChange = function (callback) {
		if (!urlChangeInit) {

			if ($sniffer.history) {
				jqLite(window).on('popstate', fireUrlChange);
			}

			if ($sniffer.hashchange) {
				jqLite(window).on('hashchange', fireUrlChange);
			}

			else self.addPollFn(fireUrlChange);
			urlChangeInit = true;
		}
		urlChangeListeners.push(callback);
		return callback;
	};


	self.baseHref = function () {
		var href = baseElement.attr('href');
		return href ? href.replace(/^https?\:\/\/[^\/]*/, '') : '';
	};


	var lastCookies = {};
	var lastCookieString = '';
	var cookiePath = self.baseHref();
	self.cookies = function (name, value) {
		var cookieLength, cookieArray, cookie, i, index;
		if (name) {
			if (value === undefined) {
				rawDocument.cookie = escape(name) + "=;path=" + cookiePath +
					";expires=Thu, 01 Jan 1970 00:00:00 GMT";
			} else {
				if (isString(value)) {
					cookieLength = (rawDocument.cookie = escape(name) + '=' + escape(value) +
							';path=' + cookiePath).length + 1;


					if (cookieLength > 4096) {
						$log.warn("Cookie '" + name + "' possibly not set or overflowed because it was too large (" +
							cookieLength + " > 4096 bytes)!");
					}
				}
			}
		} else {
			if (rawDocument.cookie !== lastCookieString) {
				lastCookieString = rawDocument.cookie;
				cookieArray = lastCookieString.split("; ");
				lastCookies = {};
				for (i = 0; i < cookieArray.length; i++) {
					cookie = cookieArray[i];
					index = cookie.indexOf('=');
					if (index > 0) {
						name = unescape(cookie.substring(0, index));
						if (lastCookies[name] === undefined) {
							lastCookies[name] = unescape(cookie.substring(index + 1));
						}
					}
				}
			}
			return lastCookies;
		}
	};
	self.defer = function (fn, delay) {
		var timeoutId;
		outstandingRequestCount++;
		timeoutId = setTimeout(function () {
			delete pendingDeferIds[timeoutId];
			completeOutstandingRequest(fn);
		}, delay || 0);
		pendingDeferIds[timeoutId] = true;
		return timeoutId;
	};
	self.defer.cancel = function (deferId) {
		if (pendingDeferIds[deferId]) {
			delete pendingDeferIds[deferId];
			clearTimeout(deferId);
			completeOutstandingRequest(noop);
			return true;
		}
		return false;
	};
}
function $BrowserProvider() {
	this.$get = ['$window', '$log', '$sniffer', '$document',
		function ($window, $log, $sniffer, $document) {
			return new Browser($window, $document, $log, $sniffer);
		}];
}
