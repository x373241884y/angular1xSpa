'use strict';
$FilterProvider.$inject = ['$provide'];
function $FilterProvider($provide) {
	var suffix = 'Filter';

	function register(name, factory) {
		if (isObject(name)) {
			var filters = {};
			forEach(name, function (filter, key) {
				filters[key] = register(key, filter);
			});
			return filters;
		} else {
			return $provide.factory(name + suffix, factory);
		}
	}

	this.register = register;
	this.$get = ['$injector', function ($injector) {
		return function (name) {
			return $injector.get(name + suffix);
		};
	}];
	////////////////////////////////////////

	register('currency', currencyFilter);
	register('date', dateFilter);
	register('filter', filterFilter);
	register('json', jsonFilter);
	register('limitTo', limitToFilter);
	register('lowercase', lowercaseFilter);
	register('number', numberFilter);
	register('orderBy', orderByFilter);
	register('uppercase', uppercaseFilter);
}
