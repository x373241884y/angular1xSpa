'use strict';
function setupModuleLoader(window) {
	var $injectorMinErr = minErr('$injector');
	var ngMinErr = minErr('ng');

	function ensure(obj, name, factory) {
		return obj[name] || (obj[name] = factory());
	}

	var angular = ensure(window, 'angular', Object);
	// We need to expose `angular.$$minErr` to modules such as `ngResource` that reference it during bootstrap
	angular.$$minErr = angular.$$minErr || minErr;
	return ensure(angular, 'module', function () {
		var modules = {};
		return function module(name, requires, configFn) {
			var assertNotHasOwnProperty = function (name, context) {
				if (name === 'hasOwnProperty') {
					throw ngMinErr('badname', 'hasOwnProperty is not a valid {0} name', context);
				}
			};
			assertNotHasOwnProperty(name, 'module');
			if (requires && modules.hasOwnProperty(name)) {
				modules[name] = null;
			}
			return ensure(modules, name, function () {
				if (!requires) {
					throw $injectorMinErr('nomod', "Module '{0}' is not available! You either misspelled " +
						"the module name or forgot to load it. If registering a module ensure that you " +
						"specify the dependencies as the second argument.", name);
				}
				var invokeQueue = [];
				var runBlocks = [];
				var config = invokeLater('$injector', 'invoke');
				var moduleInstance = {
					// Private state
					_invokeQueue: invokeQueue,
					_runBlocks: runBlocks,
					requires: requires,
					name: name,
					provider: invokeLater('$provide', 'provider'),
					factory: invokeLater('$provide', 'factory'),
					service: invokeLater('$provide', 'service'),
					value: invokeLater('$provide', 'value'),
					constant: invokeLater('$provide', 'constant', 'unshift'),
					animation: invokeLater('$animateProvider', 'register'),
					filter: invokeLater('$filterProvider', 'register'),
					controller: invokeLater('$controllerProvider', 'register'),
					directive: invokeLater('$compileProvider', 'directive'),
					config: config,
					run: function (block) {
						runBlocks.push(block);
						return this;
					}
				};
				if (configFn) {
					config(configFn);
				}
				return moduleInstance;
				function invokeLater(provider, method, insertMethod) {
					return function () {
						invokeQueue[insertMethod || 'push']([provider, method, arguments]);
						return moduleInstance;
					};
				}
			});
		};
	});
}
