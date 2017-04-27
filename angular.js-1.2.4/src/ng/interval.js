'use strict';
function $IntervalProvider() {
	this.$get = ['$rootScope', '$window', '$q',
		function ($rootScope, $window, $q) {
			var intervals = {};

			function interval(fn, delay, count, invokeApply) {
				var setInterval = $window.setInterval,
					clearInterval = $window.clearInterval,
					deferred = $q.defer(),
					promise = deferred.promise,
					iteration = 0,
					skipApply = (isDefined(invokeApply) && !invokeApply);

				count = isDefined(count) ? count : 0,
					promise.then(null, null, fn);
				promise.$$intervalId = setInterval(function tick() {
					deferred.notify(iteration++);
					if (count > 0 && iteration >= count) {
						deferred.resolve(iteration);
						clearInterval(promise.$$intervalId);
						delete intervals[promise.$$intervalId];
					}
					if (!skipApply) $rootScope.$apply();
				}, delay);
				intervals[promise.$$intervalId] = deferred;
				return promise;
			}

			interval.cancel = function (promise) {
				if (promise && promise.$$intervalId in intervals) {
					intervals[promise.$$intervalId].reject('canceled');
					clearInterval(promise.$$intervalId);
					delete intervals[promise.$$intervalId];
					return true;
				}
				return false;
			};
			return interval;
		}];
}
