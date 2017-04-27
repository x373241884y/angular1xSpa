'use strict';
var ngEventDirectives = {};
forEach(
	'click dblclick mousedown mouseup mouseover mouseout mousemove mouseenter mouseleave keydown keyup keypress submit focus blur copy cut paste'.split(' '),
	function (name) {
		var directiveName = directiveNormalize('ng-' + name);
		ngEventDirectives[directiveName] = ['$parse', function ($parse) {
			return {
				compile: function ($element, attr) {
					var fn = $parse(attr[directiveName]);
					return function (scope, element, attr) {
						element.on(lowercase(name), function (event) {
							scope.$apply(function () {
								fn(scope, {$event: event});
							});
						});
					};
				}
			};
		}];
	}
);
