'use strict';
function $LogProvider() {
	var debug = true,
		self = this;

	this.debugEnabled = function (flag) {
		if (isDefined(flag)) {
			debug = flag;
			return this;
		} else {
			return debug;
		}
	};

	this.$get = ['$window', function ($window) {
		return {
			log: consoleLog('log'),
			info: consoleLog('info'),
			warn: consoleLog('warn'),
			error: consoleLog('error'),

			debug: (function () {
				var fn = consoleLog('debug');
				return function () {
					if (debug) {
						fn.apply(self, arguments);
					}
				};
			}())
		};
		function formatError(arg) {
			if (arg instanceof Error) {
				if (arg.stack) {
					arg = (arg.message && arg.stack.indexOf(arg.message) === -1)
						? 'Error: ' + arg.message + '\n' + arg.stack
						: arg.stack;
				} else if (arg.sourceURL) {
					arg = arg.message + '\n' + arg.sourceURL + ':' + arg.line;
				}
			}
			return arg;
		}

		function consoleLog(type) {
			var console = $window.console || {},
				logFn = console[type] || console.log || noop;
			if (logFn.apply) {
				return function () {
					var args = [];
					forEach(arguments, function (arg) {
						args.push(formatError(arg));
					});
					return logFn.apply(console, args);
				};
			}
			// we are IE which either doesn't have window.console => this is noop and we do nothing,
			// or we are IE where console.log doesn't have apply so we log at least first 2 args
			return function (arg1, arg2) {
				logFn(arg1, arg2 == null ? '' : arg2);
			};
		}
	}];
}
