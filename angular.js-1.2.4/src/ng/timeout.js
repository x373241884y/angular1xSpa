'use strict';
function $TimeoutProvider() {
	this.$get = ['$rootScope', '$browser', '$q', '$exceptionHandler',
		function ($rootScope, $browser, $q, $exceptionHandler) {
			var deferreds = {};

			function timeout(fn, delay, invokeApply) {
				var deferred = $q.defer(),
					promise = deferred.promise,
					skipApply = (isDefined(invokeApply) && !invokeApply),
					timeoutId;
				timeoutId = $browser.defer(function () {
					try {
						deferred.resolve(fn());
					} catch (e) {
						deferred.reject(e);
						$exceptionHandler(e);
					}
					finally {
						delete deferreds[promise.$$timeoutId];
					}
					if (!skipApply) $rootScope.$apply();
				}, delay);
				promise.$$timeoutId = timeoutId;
				deferreds[timeoutId] = deferred;
				return promise;
			}

			timeout.cancel = function (promise) {
				if (promise && promise.$$timeoutId in deferreds) {
					deferreds[promise.$$timeoutId].reject('canceled');
					delete deferreds[promise.$$timeoutId];
					return $browser.defer.cancel(promise.$$timeoutId);
				}
				return false;
			};
			return timeout;
		}];
}
