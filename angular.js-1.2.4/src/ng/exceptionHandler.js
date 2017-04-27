'use strict';
function $ExceptionHandlerProvider() {
	this.$get = ['$log', function ($log) {
		return function (exception, cause) {
			$log.error.apply($log, arguments);
		};
	}];
}
