'use strict';
function $ControllerProvider() {
	var controllers = {},
		CNTRL_REG = /^(\S+)(\s+as\s+(\w+))?$/;
	this.register = function (name, constructor) {
		assertNotHasOwnProperty(name, 'controller');
		if (isObject(name)) {
			extend(controllers, name);
		} else {
			controllers[name] = constructor;
		}
	};
	this.$get = ['$injector', '$window', function ($injector, $window) {
		return function (expression, locals) {
			var instance, match, constructor, identifier;
			if (isString(expression)) {
				match = expression.match(CNTRL_REG);
				constructor = match[1];
				identifier = match[3];
				if (controllers.hasOwnProperty(constructor)) {
					expression = controllers[constructor];
				} else {
					expression = getter(locals.$scope, constructor, true) || getter($window, constructor, true);
				}
				assertArgFn(expression, constructor, true);
			}
			instance = $injector.instantiate(expression, locals);
			if (identifier) {
				if (!(locals && typeof locals.$scope == 'object')) {
					throw minErr('$controller')('noscp', "Cannot export controller '{0}' as '{1}'! No $scope object provided via `locals`.",
						constructor || expression.name, identifier);
				}
				locals.$scope[identifier] = instance;
			}
			return instance;
		};
	}];
}
